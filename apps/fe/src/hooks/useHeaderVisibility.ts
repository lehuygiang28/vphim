import { useState, useEffect, useCallback, RefObject } from 'react';
import { create } from 'zustand';

type HeaderVisibilityStore = {
    isVisible: boolean;
    isScrolled: boolean;
    isScrolling: boolean;
    isPositionFixed: boolean;
    showHeader: () => void;
    hideHeader: () => void;
    toggleHeader: () => void;
    setScrolled: (scrolled: boolean) => void;
    disableAutoControl: () => void;
    enableAutoControl: () => void;
    isAutoControlEnabled: boolean;
    setScrolling: (scrolling: boolean) => void;
    setPositionFixed: (fixed: boolean) => void;
};

// Create a store to share state between components
export const useHeaderVisibilityStore = create<HeaderVisibilityStore>((set) => ({
    isVisible: true,
    isScrolled: false,
    isScrolling: false,
    isPositionFixed: true,
    isAutoControlEnabled: true,
    showHeader: () => set({ isVisible: true }),
    hideHeader: () => set({ isVisible: false }),
    toggleHeader: () => set((state) => ({ isVisible: !state.isVisible })),
    setScrolled: (scrolled: boolean) => set({ isScrolled: scrolled }),
    disableAutoControl: () => set({ isAutoControlEnabled: false }),
    enableAutoControl: () => set({ isAutoControlEnabled: true }),
    setScrolling: (scrolling: boolean) => set({ isScrolling: scrolling }),
    setPositionFixed: (fixed: boolean) => set({ isPositionFixed: fixed }),
}));

type UseHeaderVisibilityProps = {
    threshold?: number;
    headerRef?: RefObject<HTMLElement>;
    autoHide?: boolean;
};

const useHeaderVisibility = ({
    threshold = 50,
    headerRef,
    autoHide = true,
}: UseHeaderVisibilityProps = {}) => {
    const {
        isVisible,
        isScrolled,
        isScrolling,
        isPositionFixed,
        showHeader,
        hideHeader,
        toggleHeader,
        setScrolled,
        isAutoControlEnabled,
        disableAutoControl,
        enableAutoControl,
        setScrolling,
        setPositionFixed,
    } = useHeaderVisibilityStore();
    const [prevScrollPos, setPrevScrollPos] = useState(0);
    const [hovering, setHovering] = useState(false);

    // Handle automatic scroll behavior
    useEffect(() => {
        if (!autoHide) return;

        const handleScroll = () => {
            const currentScrollPos = window.scrollY;
            const scrollingUp = prevScrollPos > currentScrollPos;

            // Only apply automatic control if it's enabled and not during smooth scrolling
            if (isAutoControlEnabled && !isScrolling) {
                // Don't hide header when hovering over it
                if (!hovering) {
                    // Only hide header when scrolling down and past the threshold
                    if (!scrollingUp && currentScrollPos > 200) {
                        hideHeader();
                    } else if (scrollingUp) {
                        showHeader();
                    }
                }
            }

            setScrolled(currentScrollPos > threshold);
            setPrevScrollPos(currentScrollPos);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [
        prevScrollPos,
        hovering,
        threshold,
        hideHeader,
        showHeader,
        setScrolled,
        autoHide,
        isAutoControlEnabled,
        isScrolling,
    ]);

    const handleMouseEnter = useCallback(() => {
        setHovering(true);
        showHeader();
    }, [showHeader]);

    const handleMouseLeave = useCallback(() => {
        setHovering(false);
    }, []);

    // Method to set the header as "during scroll" for better performance
    const setHeaderDuringScroll = useCallback(
        (scrolling: boolean) => {
            setScrolling(scrolling);
            if (scrolling) {
                hideHeader();
            }
        },
        [hideHeader, setScrolling],
    );

    // Method to toggle fixed/absolute positioning for better performance
    const setHeaderPositionFixed = useCallback(
        (fixed: boolean) => {
            setPositionFixed(fixed);
            // When we switch to absolute, also hide the header
            if (!fixed) {
                hideHeader();
            }
        },
        [hideHeader, setPositionFixed],
    );

    // Attach hover handlers to the header ref if provided
    useEffect(() => {
        const headerElement = headerRef?.current;
        if (headerElement) {
            headerElement.addEventListener('mouseenter', handleMouseEnter);
            headerElement.addEventListener('mouseleave', handleMouseLeave);

            return () => {
                headerElement.removeEventListener('mouseenter', handleMouseEnter);
                headerElement.removeEventListener('mouseleave', handleMouseLeave);
            };
        }
    }, [headerRef, handleMouseEnter, handleMouseLeave]);

    return {
        isVisible,
        isScrolled,
        isScrolling,
        isPositionFixed,
        showHeader,
        hideHeader,
        toggleHeader,
        handleMouseEnter,
        handleMouseLeave,
        disableAutoControl,
        enableAutoControl,
        isAutoControlEnabled,
        setHeaderDuringScroll,
        setHeaderPositionFixed,
    };
};

export default useHeaderVisibility;
