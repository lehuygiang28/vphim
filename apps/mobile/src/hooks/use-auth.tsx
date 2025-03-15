import { useCallback, useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import authStore from '~mb/stores/authStore';
import { LoginResponseDto } from '~api/app/auth/dtos/login-response.dto';
import { refreshSession, logout, loginWithOTP, requestOTP } from '~mb/libs/authActions';

// Maximum time of inactivity before automatic logout (ms)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

interface UseAuthReturn {
    user: LoginResponseDto | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isSessionExpired: boolean;
    login: (email: string, otp: string) => Promise<boolean>;
    requestOTP: (email: string) => Promise<boolean>;
    logout: () => void;
    refreshSession: () => Promise<void>;
}

/**
 * Hook to access and manage authentication state
 *
 * Provides methods for login, logout, session refresh, and access to user data
 * Also handles automatic session refresh and logout on inactivity
 */
export function useAuth(): UseAuthReturn {
    const { session, isLoading } = authStore();
    const [user, setUser] = useState<LoginResponseDto | null>(session?.user || null);

    // Reference to last activity timestamp
    const lastActivityRef = useRef<number>(Date.now());
    // Reference to inactivity timer
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    // App state for detecting background/foreground transitions
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);

    // Update local user state when store changes
    useEffect(() => {
        setUser(session?.user || null);
    }, [session]);

    // Reset inactivity timer whenever user interacts
    const resetInactivityTimer = useCallback(() => {
        lastActivityRef.current = Date.now();

        // Clear existing timer
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }

        // Only set timer if user is authenticated
        if (authStore.getState().isAuthenticated()) {
            inactivityTimerRef.current = setTimeout(() => {
                console.log('User inactive for too long, logging out');
                logout();
            }, INACTIVITY_TIMEOUT);
        }
    }, []);

    // Monitor app state changes to handle background/foreground transitions
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            // App came back to foreground
            if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
                // Check if session expired during background state
                if (
                    authStore.getState().isSessionExpired() &&
                    authStore.getState().getRefreshToken()
                ) {
                    refreshSession().catch(console.error);
                }
                resetInactivityTimer();
            }

            // App went to background
            if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
                // Clear inactivity timer when app goes to background
                if (inactivityTimerRef.current) {
                    clearTimeout(inactivityTimerRef.current);
                    inactivityTimerRef.current = null;
                }
            }

            appStateRef.current = nextAppState;
        });

        // Initial timer setup
        resetInactivityTimer();

        return () => {
            subscription.remove();
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
        };
    }, [resetInactivityTimer]);

    // Check session validity on mount and set up refresh interval
    useEffect(() => {
        // Initial session check
        if (session && authStore.getState().isSessionExpired()) {
            refreshSession().catch(console.error);
        }

        // Set up interval to check session validity
        const interval = setInterval(() => {
            if (session && authStore.getState().isSessionExpired()) {
                refreshSession().catch(console.error);
            }
        }, 5 * 60 * 1000); // Check every 5 minutes

        return () => clearInterval(interval);
    }, [session]);

    const handleLogin = useCallback(
        async (email: string, otp: string): Promise<boolean> => {
            const success = await loginWithOTP(email, otp);
            if (success) {
                resetInactivityTimer();
            }
            return success;
        },
        [resetInactivityTimer],
    );

    const handleRequestOTP = useCallback(async (email: string): Promise<boolean> => {
        return await requestOTP(email);
    }, []);

    const handleLogout = useCallback(() => {
        logout();
        // Clear any inactivity timer
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
            inactivityTimerRef.current = null;
        }
    }, []);

    const handleRefreshSession = useCallback(async () => {
        await refreshSession();
        resetInactivityTimer();
    }, [resetInactivityTimer]);

    return {
        user,
        isLoading,
        isAuthenticated: authStore.getState().isAuthenticated(),
        isSessionExpired: authStore.getState().isSessionExpired(),
        login: handleLogin,
        requestOTP: handleRequestOTP,
        logout: handleLogout,
        refreshSession: handleRefreshSession,
    };
}
