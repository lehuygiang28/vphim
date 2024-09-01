import { useRef, useEffect, useCallback } from 'react';

export function useDebouncedCallback(
    callback: (...args: unknown[]) => void,
    delay: number,
): (...args: unknown[]) => void {
    const callbackRef = useRef(callback);
    const timeoutRef = useRef<NodeJS.Timeout | undefined>();

    // Update callback if it changes.
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    // Return a debounced function
    return useCallback(
        (...args: unknown[]) => {
            // Clear existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Start new timeout
            timeoutRef.current = setTimeout(() => {
                callbackRef.current(...args);
            }, delay);
        },
        [delay],
    );
}
