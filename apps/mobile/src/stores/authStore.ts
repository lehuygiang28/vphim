import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

import type { LoginResponseDto } from '~api/app/auth/dtos/login-response.dto';

// Custom storage adapter for SecureStore
const secureStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        return await SecureStore.getItemAsync(name);
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await SecureStore.setItemAsync(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        await SecureStore.deleteItemAsync(name);
    },
};

interface AuthState {
    isLoading: boolean;
    session: { user: LoginResponseDto } | null;
    setSession: (session: { user: LoginResponseDto } | null) => void;
    clearSession: () => void;
    getAccessToken: () => string | null;
    getRefreshToken: () => string | null;
    getUser: () => LoginResponseDto | null;
    setIsLoading: (isLoading: boolean) => void;
}

const authStore = create<AuthState>()(
    persist(
        (set, get) => ({
            isLoading: true,
            session: null,
            setSession: (session: { user: LoginResponseDto } | null) =>
                set({ session, isLoading: false }),
            clearSession: () => set({ session: null, isLoading: false }),
            getAccessToken: () => get().session?.user.accessToken || null,
            getRefreshToken: () => get().session?.user.refreshToken || null,
            getUser: () => get().session?.user || null,
            setIsLoading: (isLoading: boolean) => set({ isLoading }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => secureStorage),
            onRehydrateStorage: () => (state) => {
                return (rehydratedState: AuthState | undefined) => {
                    if (rehydratedState) {
                        authStore.setState({ isLoading: false });
                    } else {
                        // If rehydration fails, we should also set isLoading to false
                        authStore.setState({ isLoading: false });
                    }
                };
            },
        },
    ),
);

export default authStore;
