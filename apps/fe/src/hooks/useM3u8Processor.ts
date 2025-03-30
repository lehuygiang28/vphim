import { useState, useEffect, useRef } from 'react';
import { type HLSSrc } from '@vidstack/react';
import { resolveUrl } from 'apps/api/src/libs/utils/common';

type ProcessorOptions = {
    provider: 'o' | 'k';
    removalIndices?: number | number[];
    proxy?: boolean; // Whether to proxy segment URLs
    removeAds?: boolean; // Whether to remove discontinuity sections (ads)
};

// Default options if not specified
const DEFAULT_OPTIONS: Partial<ProcessorOptions> = {
    removeAds: true,
    proxy: false,
};

type ProcessorState = {
    isProcessing: boolean;
    processedSrc: HLSSrc | null;
    error: Error | null;
};

// Get proxy URL from environment variables
const getProxyUrl = (): string => {
    return process.env.NEXT_PUBLIC_STREAM_PROXY_URL || 'https://stream.vephim.online/?url=';
};

// Helper function to add timeout to fetch requests
const fetchWithTimeout = async (
    url: string,
    options: RequestInit = {},
    timeout = 10000,
): Promise<Response> => {
    const controller = new AbortController();
    const { signal } = controller;

    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, { ...options, signal });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
};

/**
 * A hook that processes M3U8 content client-side
 *
 * @param m3u8Url - The URL of the M3U8 playlist to process, or null to disable processing
 * @param options - Processing options including provider, indices to remove, and proxy settings
 * @returns A state object with processing status, processed source, and error
 */
export function useM3u8Processor(
    m3u8Url: string | null,
    options: ProcessorOptions,
): ProcessorState {
    // Apply default options
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

    const [state, setState] = useState<ProcessorState>({
        isProcessing: Boolean(m3u8Url),
        processedSrc: null,
        error: null,
    });

    // Store the last created blob URL for cleanup
    const blobUrlRef = useRef<string | null>(null);

    useEffect(() => {
        // Clear previous state when URL changes
        setState((prev) => ({
            ...prev,
            isProcessing: Boolean(m3u8Url),
            error: null,
        }));

        // If URL is null, explicitly disable processing
        if (!m3u8Url) {
            setState({
                isProcessing: false,
                processedSrc: null,
                error: null,
            });

            // Clean up any previous blob URL
            if (blobUrlRef.current) {
                try {
                    URL.revokeObjectURL(blobUrlRef.current);
                    blobUrlRef.current = null;
                } catch (e) {
                    console.warn('Failed to revoke blob URL', e);
                }
            }

            return;
        }

        let isMounted = true;

        const processM3u8 = async () => {
            try {
                setState((prev) => ({ ...prev, isProcessing: true, error: null }));

                // Fetch the initial m3u8 file
                const response = await fetchWithTimeout(m3u8Url);
                if (!response.ok)
                    throw new Error(`Failed to fetch m3u8 content: ${response.status}`);

                let content = await response.text();
                let baseUrl = extractBaseUrl(m3u8Url);

                // Check if it's a master playlist and fetch the variant if needed
                if (content.includes('#EXT-X-STREAM-INF')) {
                    const variantUrl = extractVariantUrl(content, baseUrl);
                    if (!variantUrl) throw new Error('Could not find variant playlist');

                    const variantResponse = await fetchWithTimeout(variantUrl);
                    if (!variantResponse.ok)
                        throw new Error(
                            `Failed to fetch variant playlist: ${variantResponse.status}`,
                        );

                    content = await variantResponse.text();
                    baseUrl = extractBaseUrl(variantUrl);
                }

                // Process the content (remove discontinuities and resolve URLs)
                const indices =
                    mergedOptions.removeAds === false
                        ? [] // Skip discontinuity removal if removeAds is false
                        : Array.isArray(mergedOptions.removalIndices)
                        ? [...new Set(mergedOptions.removalIndices)].sort((a, b) => a - b)
                        : mergedOptions.removalIndices
                        ? [mergedOptions.removalIndices]
                        : mergedOptions.provider === 'o'
                        ? [16, 17]
                        : [1];

                const processedContent = removeDiscontinuitySections(
                    content,
                    indices,
                    baseUrl,
                    mergedOptions.proxy,
                );

                // Clean up previous blob URL
                if (blobUrlRef.current) {
                    try {
                        URL.revokeObjectURL(blobUrlRef.current);
                        blobUrlRef.current = null;
                    } catch (e) {
                        console.warn('Failed to revoke previous blob URL', e);
                    }
                }

                // Create a blob URL for the processed content
                const blob = new Blob([processedContent], {
                    type: 'application/x-mpegurl',
                });
                const blobUrl = URL.createObjectURL(blob);
                blobUrlRef.current = blobUrl;

                if (isMounted) {
                    setState({
                        isProcessing: false,
                        processedSrc: {
                            src: blobUrl,
                            type: 'application/x-mpegurl',
                        },
                        error: null,
                    });
                }
            } catch (error) {
                console.error('M3u8 processing error:', error);
                if (isMounted) {
                    setState({
                        isProcessing: false,
                        processedSrc: null,
                        error: error instanceof Error ? error : new Error('Failed to process m3u8'),
                    });
                }
            }
        };

        processM3u8();

        return () => {
            isMounted = false;
            // Don't revoke the blob URL here, as it will be reused until the component unmounts
            // or the m3u8Url changes
        };
    }, [
        m3u8Url,
        mergedOptions.provider,
        mergedOptions.removalIndices,
        mergedOptions.proxy,
        mergedOptions.removeAds,
    ]);

    // Clean up blob URL when component unmounts
    useEffect(() => {
        return () => {
            if (blobUrlRef.current) {
                try {
                    URL.revokeObjectURL(blobUrlRef.current);
                    blobUrlRef.current = null;
                } catch (e) {
                    console.warn('Failed to revoke blob URL on unmount', e);
                }
            }
        };
    }, []);

    return state;
}

// Helper functions
function extractBaseUrl(url: string): string {
    const lastSlashIndex = url.lastIndexOf('/');
    if (lastSlashIndex !== -1) {
        return url.substring(0, lastSlashIndex + 1);
    }

    try {
        const urlObj = new URL(url);
        const segments = urlObj.pathname.split('/');
        segments.pop();
        urlObj.pathname = segments.join('/') + '/';
        return urlObj.toString();
    } catch (e) {
        return url;
    }
}

function extractVariantUrl(content: string, baseUrl: string): string | null {
    const lines = content.split('\n');
    let variantUrl: string | null = null;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXT-X-STREAM-INF')) {
            variantUrl = i + 1 < lines.length ? lines[i + 1].trim() : null;
            break;
        }
    }

    if (!variantUrl) return null;

    // Resolve the variant URL if it's relative
    return !variantUrl.startsWith('http') ? resolveUrl(variantUrl, baseUrl) : variantUrl;
}

function removeDiscontinuitySections(
    content: string,
    indices: number[],
    baseUrl: string,
    useProxy = false,
): string {
    const lines = content.split('\n');

    // Find all discontinuity markers
    const discontinuityIndices: number[] = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '#EXT-X-DISCONTINUITY') {
            discontinuityIndices.push(i);
        }
    }

    // Fast path - if no discontinuities or nothing to remove, just resolve URLs
    if (discontinuityIndices.length === 0 || indices.length === 0) {
        return resolveSegmentUrls(lines, baseUrl, useProxy);
    }

    // Create a map of lines to keep (true) or remove (false)
    const keepLine = new Array(lines.length).fill(true);

    // Mark sections to remove
    for (const index of indices) {
        if (index > 0 && index <= discontinuityIndices.length) {
            const startIndex = discontinuityIndices[index - 1];
            const endIndex =
                index === discontinuityIndices.length ? lines.length : discontinuityIndices[index];

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
                const resolvedUrl = resolveUrl(line, baseUrl);
                if (useProxy) {
                    result.push(`${getProxyUrl()}${encodeURIComponent(resolvedUrl)}`);
                } else {
                    result.push(resolvedUrl);
                }
                continue;
            } else if (useProxy) {
                // If it's already an absolute URL but we need to proxy it
                result.push(`${getProxyUrl()}${encodeURIComponent(line)}`);
                continue;
            }
        }

        result.push(line);
    }

    return result.join('\n');
}

function resolveSegmentUrls(lines: string[], baseUrl: string, useProxy = false): string {
    const result: string[] = [];

    for (const line of lines) {
        const trimmedLine = line.trim();

        // For segment URLs, resolve if they are relative
        if (trimmedLine && !trimmedLine.startsWith('#')) {
            if (!trimmedLine.startsWith('http')) {
                const resolvedUrl = resolveUrl(trimmedLine, baseUrl);
                if (useProxy) {
                    result.push(`${getProxyUrl()}${encodeURIComponent(resolvedUrl)}`);
                } else {
                    result.push(resolvedUrl);
                }
                continue;
            } else if (useProxy) {
                // If it's already an absolute URL but we need to proxy it
                result.push(`${getProxyUrl()}${encodeURIComponent(trimmedLine)}`);
                continue;
            }
        }

        result.push(trimmedLine);
    }

    return result.join('\n');
}
