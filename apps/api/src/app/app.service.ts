import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { URL } from 'url';
import { resolveUrl } from '../libs/utils';

@Injectable()
export class AppService {
    private readonly logger = new Logger(AppService.name);
    constructor(private readonly httpService: HttpService) {}

    /**
     * Extracts the base URL from an m3u8 URL by removing the last segment.
     * For example, given:
     *   https://vip.opstream13.com/20240106/2130_b3a9de4c/3000k/hls/mixed.m3u8
     * it returns:
     *   https://vip.opstream13.com/20240106/2130_b3a9de4c/3000k/hls/
     *
     * @param m3u8Url The full m3u8 URL.
     * @returns The extracted base URL.
     */
    private extractBaseUrl(m3u8Url: string): string {
        const urlObj = new URL(m3u8Url);
        const segments = urlObj.pathname.split('/');
        segments.pop(); // Remove the last segment (e.g., 'mixed.m3u8')
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
            Origin: baseUrl ? new URL(baseUrl).origin : 'https://www.google.com',
        };
    }

    /**
     * Processes an m3u8 playlist by:
     *  - Downloading it from the provided URL.
     *  - If the downloaded content is a master playlist (contains #EXT-X-STREAM-INF),
     *    extract the variant playlist URL and download that.
     *  - Removing the nth occurrence of '#EXT-X-DISCONTINUITY' (discontinuity marker),
     *    where the nth occurrence is determined by the removalIndex parameter.
     *    If removalIndex is not provided, it defaults based on the provider:
     *      - 'op' => 16
     *      - 'kk' => 1
     *  - Appending the base URL to any relative segment URLs.
     *    If baseUrl is not provided, it is extracted from the m3u8Url.
     *
     * @param provider - A provider name ('op' or 'kk').
     * @param m3u8Url - The URL to download the m3u8 playlist.
     * @param removalIndex - (Optional) The nth discontinuity marker to remove.
     * @param baseUrl - (Optional) Base URL to prepend to relative segment URLs.
     * @returns The updated m3u8 file content.
     */
    async processM3U8(
        provider: 'o' | 'k',
        m3u8Url: string,
        removalIndex?: number,
        baseUrl?: string,
    ): Promise<string> {
        // Set default removalIndex based on provider if not provided.
        if (removalIndex === undefined) {
            removalIndex = provider === 'o' ? 16 : 1;
        }

        // If baseUrl is not provided, extract it from the m3u8Url.
        if (!baseUrl) {
            baseUrl = this.extractBaseUrl(m3u8Url);
        }

        // Define custom headers to mimic a browser.
        const headers = this.getRequestHeaders();

        // Download the m3u8 file content with custom headers.
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

        // If the downloaded content is a master playlist, extract and download the variant playlist.
        if (responseData.includes('#EXT-X-STREAM-INF')) {
            const lines = responseData.split('\n');
            let variantUrl: string | undefined;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('#EXT-X-STREAM-INF')) {
                    if (i + 1 < lines.length) {
                        variantUrl = lines[i + 1].trim();
                        break;
                    }
                }
            }
            if (!variantUrl) {
                this.logger.error(`Variant playlist not found in the master playlist: ${m3u8Url}`);
                throw new BadRequestException();
            }

            // Resolve the variant URL if it's relative
            let fullVariantUrl: string;
            if (!variantUrl.startsWith('http://') && !variantUrl.startsWith('https://')) {
                fullVariantUrl = resolveUrl(variantUrl, baseUrl);
            } else {
                fullVariantUrl = variantUrl;
            }

            // Download the variant playlist with custom headers.
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

        // Process the m3u8 content by removing the specified discontinuity section
        const lines = responseData.split('\n');
        const newLines: string[] = [];

        // Find all discontinuity markers
        const discontinuityIndices: number[] = [];
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim() === '#EXT-X-DISCONTINUITY') {
                discontinuityIndices.push(i);
            }
        }

        // Determine the section to remove
        let startRemove = -1;
        let endRemove = -1;

        if (discontinuityIndices.length >= removalIndex) {
            startRemove = discontinuityIndices[removalIndex - 1];

            // If this is the last discontinuity, remove until end of file
            // Otherwise, remove until the next discontinuity (exclusive)
            if (removalIndex >= discontinuityIndices.length) {
                endRemove = lines.length;
            } else {
                endRemove = discontinuityIndices[removalIndex];
            }
        }

        // Add all lines except those in the section to remove
        for (let i = 0; i < lines.length; i++) {
            // Skip lines in the section to remove
            if (i >= startRemove && i < endRemove) {
                continue;
            }

            const trimmedLine = lines[i].trim();

            // For segment URLs, append the baseUrl if they are relative
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                if (!trimmedLine.startsWith('http://') && !trimmedLine.startsWith('https://')) {
                    const updatedSegment = resolveUrl(trimmedLine, baseUrl);
                    newLines.push(updatedSegment);
                    continue;
                }
            }

            newLines.push(trimmedLine);
        }

        return newLines.join('\n');
    }
}
