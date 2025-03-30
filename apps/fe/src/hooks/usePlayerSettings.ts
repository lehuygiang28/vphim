import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PlayerSettingsState {
    // State
    useAdBlocker: boolean;
    useProxyStreaming: boolean;

    // Actions
    toggleAdBlocking: () => void;
    toggleProxyStreaming: () => void;

    // Reset function
    reset: () => void;
}

/**
 * Zustand store for managing player settings with localStorage persistence
 * Handles settings for ad blocking and proxy streaming features
 */
export const usePlayerSettings = create<PlayerSettingsState>()(
    persist(
        (set) => ({
            // Default values for settings
            useAdBlocker: true,
            useProxyStreaming: false,

            // Toggle function for ad blocker
            toggleAdBlocking: () =>
                set((state) => ({
                    useAdBlocker: !state.useAdBlocker,
                })),

            // Toggle function for proxy streaming
            toggleProxyStreaming: () =>
                set((state) => ({
                    useProxyStreaming: !state.useProxyStreaming,
                })),

            // Reset function to restore defaults
            reset: () =>
                set({
                    useAdBlocker: true,
                    useProxyStreaming: false,
                }),
        }),
        {
            name: 'vphim-player-settings',
            partialize: (state) => ({
                useAdBlocker: state.useAdBlocker,
                useProxyStreaming: state.useProxyStreaming,
            }),
        },
    ),
);
