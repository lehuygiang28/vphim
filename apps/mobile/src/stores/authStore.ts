import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

import type { LoginResponseDto } from '~api/app/auth/dtos/login-response.dto';

// Define keys for storage
const AUTH_STORAGE_KEY = 'auth-storage';

// Custom storage adapter for SecureStore with better error handling
const secureStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        try {
            return await SecureStore.getItemAsync(name);
        } catch (error) {
            console.error('Error retrieving from SecureStore:', error);
            return null;
        }
    },
    setItem: async (name: string, value: string): Promise<void> => {
        try {
            await SecureStore.setItemAsync(name, value);
        } catch (error) {
            console.error('Error saving to SecureStore:', error);
        }
    },
    removeItem: async (name: string): Promise<void> => {
        try {
            await SecureStore.deleteItemAsync(name);
        } catch (error) {
            console.error('Error removing from SecureStore:', error);
        }
    },
};

// Define session type
export interface Session {
    user: LoginResponseDto;
    expiresAt?: number; // Optional timestamp when session expires
}

interface AuthState {
    isLoading: boolean;
    session: Session | null;
    setSession: (session: Session | null) => void;
    clearSession: () => void;
    getAccessToken: () => string | null;
    getRefreshToken: () => string | null;
    getUser: () => LoginResponseDto | null;
    setIsLoading: (isLoading: boolean) => void;
    isSessionExpired: () => boolean;
    isAuthenticated: () => boolean;
}

const authStore = create<AuthState>()(
    persist(
        (set, get) => ({
            isLoading: true,
            session: null,
            setSession: (session: Session | null) => {
                // If we have a session with tokens, calculate expiration time
                const expiresAt = session?.user.accessToken
                    ? Date.now() + 23 * 60 * 60 * 1000 // Default to 23 hours if not provided
                    : undefined;

                set({
                    session: session ? { ...session, expiresAt } : null,
                    isLoading: false,
                });
            },
            clearSession: () => set({ session: null, isLoading: false }),
            getAccessToken: () => get().session?.user.accessToken || null,
            getRefreshToken: () => get().session?.user.refreshToken || null,
            getUser: () => get().session?.user || null,
            setIsLoading: (isLoading: boolean) => set({ isLoading }),
            isSessionExpired: () => {
                const { session } = get();
                if (!session || !session.expiresAt) return true;
                return Date.now() > session.expiresAt;
            },
            isAuthenticated: () => {
                const { session } = get();
                return !!session && !!session.user && !get().isSessionExpired();
            },
        }),
        {
            name: AUTH_STORAGE_KEY,
            storage: createJSONStorage(() => secureStorage),
        },
    ),
);

export default authStore;
