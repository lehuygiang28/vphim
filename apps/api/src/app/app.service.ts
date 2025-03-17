import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { URL } from 'url';
import { resolveUrl } from '../libs/utils';
import { RedisService } from '../libs/modules/redis';

@Injectable()
export class AppService {
    private readonly logger = new Logger(AppService.name);
    private readonly CACHE_PREFIX = 'CACHE_M3U8:';
    private readonly CACHE_TTL = 3600000; // 1 hour cache TTL in milliseconds

    constructor(
        private readonly httpService: HttpService,
        private readonly redisService: RedisService,
    ) {}

    /**
     * Extracts the base URL from an m3u8 URL by removing the last segment.
     */
    private extractBaseUrl(m3u8Url: string): string {
        const lastSlashIndex = m3u8Url.lastIndexOf('/');
        if (lastSlashIndex !== -1) {
            return m3u8Url.substring(0, lastSlashIndex + 1);
        }

        // Fallback to URL parsing if simple string manipulation fails
        const urlObj = new URL(m3u8Url);
        const segments = urlObj.pathname.split('/');
        segments.pop();
        urlObj.pathname = segments.join('/') + '/';
        return urlObj.toString();
    }

    /**
     * Returns headers to mimic a browser request.
     */
    private getRequestHeaders(baseUrl?: string): Record<string, string> {
        return {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
            Accept: '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            Origin: baseUrl ? new URL(baseUrl).origin : baseUrl,
        };
    }

    /**
     * Processes an m3u8 playlist by:
     *  - Downloading it from the provided URL.
     *  - If the downloaded content is a master playlist (contains #EXT-X-STREAM-INF),
     *    extract the variant playlist URL and download that.
     *  - Removing the nth occurrence of '#EXT-X-DISCONTINUITY' (discontinuity marker),
     *    where the nth occurrences are determined by the removalIndices parameter.
     *    If removalIndices is not provided, it defaults based on the provider:
     *      - 'o' => [16]
     *      - 'k' => [1]
     *  - Appending the base URL to any relative segment URLs.
     *    If baseUrl is not provided, it is extracted from the m3u8Url.
     *
     * @param provider - A provider name ('o' or 'k').
     * @param m3u8Url - The URL to download the m3u8 playlist.
     * @param removalIndices - (Optional) Array of discontinuity markers to remove.
     * @param baseUrl - (Optional) Base URL to prepend to relative segment URLs.
     * @returns The updated m3u8 file content.
     */
    async processM3U8(
        provider: 'o' | 'k',
        m3u8Url: string,
        removalIndices?: number | number[],
        baseUrl?: string,
    ): Promise<string> {
        // Set default removalIndices based on provider if not provided
        if (removalIndices === undefined) {
            removalIndices = provider === 'o' ? [16, 17] : [1];
        }

        // Convert to array and sort unique indices for optimal processing
        const indices = Array.isArray(removalIndices)
            ? [...new Set(removalIndices)].sort((a, b) => a - b)
            : [removalIndices];

        // Create a cache key from URL and indices
        const cacheKey = `${this.CACHE_PREFIX}${m3u8Url}:${indices.join(',')}`;

        // Check cache first
        const cachedResult = await this.redisService.get<string>(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }

        // If baseUrl is not provided, extract it from the m3u8Url
        if (!baseUrl) {
            baseUrl = this.extractBaseUrl(m3u8Url);
        }

        // Define custom headers to mimic a browser request
        const headers = this.getRequestHeaders(baseUrl);

        // Download the m3u8 file content with custom headers
        let responseData: string;
        try {
            const response = await lastValueFrom(
                this.httpService.get(m3u8Url, { responseType: 'text', headers }),
            );
            responseData = response.data;
        } catch (error) {
            this.logger.error(`Failed to download the m3u8 file: ${m3u8Url}`);
            throw new BadRequestException();
        }

        // If the downloaded content is a master playlist, extract and download the variant playlist
        if (responseData.includes('#EXT-X-STREAM-INF')) {
            const lines = responseData.split('\n');
            let variantUrl: string | undefined;

            // Quick scan for variant URL
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('#EXT-X-STREAM-INF')) {
                    variantUrl = i + 1 < lines.length ? lines[i + 1].trim() : undefined;
                    break;
                }
            }

            if (!variantUrl) {
                this.logger.error(`Variant playlist not found in the master playlist: ${m3u8Url}`);
                throw new BadRequestException();
            }

            // Resolve the variant URL if it's relative
            const fullVariantUrl = !variantUrl.startsWith('http')
                ? resolveUrl(variantUrl, baseUrl)
                : variantUrl;

            // Download the variant playlist with custom headers
            try {
                const variantResponse = await lastValueFrom(
                    this.httpService.get(fullVariantUrl, {
                        responseType: 'text',
                        headers,
                    }),
                );
                responseData = variantResponse.data;

                // Update the baseUrl to be relative to the variant playlist
                baseUrl = this.extractBaseUrl(fullVariantUrl);
            } catch (error) {
                this.logger.error(`Failed to download the variant m3u8 file: ${fullVariantUrl}`);
                throw new BadRequestException();
            }
        }

        // Process the m3u8 content more efficiently
        const processedContent = this.removeDiscontinuitySections(responseData, indices, baseUrl);

        // Cache the result in Redis
        await this.redisService.set(cacheKey, processedContent, this.CACHE_TTL);

        return processedContent;
    }

    /**
     * Efficiently removes discontinuity sections from m3u8 content
     */
    private removeDiscontinuitySections(
        content: string,
        indices: number[],
        baseUrl: string,
    ): string {
        const lines = content.split('\n');

        // Find all discontinuity markers (single pass)
        const discontinuityIndices: number[] = [];
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim() === '#EXT-X-DISCONTINUITY') {
                discontinuityIndices.push(i);
            }
        }

        // Fast path - if no discontinuities or nothing to remove, just resolve URLs
        if (discontinuityIndices.length === 0 || indices.length === 0) {
            return this.resolveSegmentUrls(lines, baseUrl);
        }

        // Create a map of lines to keep (true) or remove (false)
        const keepLine = new Array(lines.length).fill(true);

        // Mark sections to remove
        for (const index of indices) {
            if (index > 0 && index <= discontinuityIndices.length) {
                const startIndex = discontinuityIndices[index - 1];
                const endIndex =
                    index === discontinuityIndices.length
                        ? lines.length
                        : discontinuityIndices[index];

                // Mark all lines in this section for removal
                for (let i = startIndex; i < endIndex; i++) {
                    keepLine[i] = false;
                }
            }
        }

        // Build the result with a single pass, resolving URLs as needed
        const result: string[] = [];
        for (let i = 0; i < lines.length; i++) {
            if (!keepLine[i]) continue;

            const line = lines[i].trim();

            // For segment URLs, resolve if they are relative
            if (line && !line.startsWith('#')) {
                if (!line.startsWith('http')) {
                    result.push(resolveUrl(line, baseUrl));
                    continue;
                }
            }

            result.push(line);
        }

        return result.join('\n');
    }

    /**
     * Just resolves segment URLs without removing sections
     */
    private resolveSegmentUrls(lines: string[], baseUrl: string): string {
        const result: string[] = [];

        for (const line of lines) {
            const trimmedLine = line.trim();

            // For segment URLs, resolve if they are relative
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                if (!trimmedLine.startsWith('http')) {
                    result.push(resolveUrl(trimmedLine, baseUrl));
                    continue;
                }
            }

            result.push(trimmedLine);
        }

        return result.join('\n');
    }

    /**
     * Clear all m3u8 cache entries from Redis
     */
    public async clearM3U8Cache(): Promise<number> {
        return this.redisService.clearByPattern(`${this.CACHE_PREFIX}*`);
    }
}
