import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { type LoginResponseDto } from 'apps/api/src/app/auth/dtos';

export interface User extends LoginResponseDto {
    accessToken: string;
    refreshToken: string;
}

export interface Session {
    user: User;
}

export function useSession() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSession();
    }, []);

    const loadSession = async () => {
        try {
            const sessionData = await AsyncStorage.getItem('session');
            if (sessionData) {
                setSession(JSON.parse(sessionData));
            }
        } catch (error) {
            console.error('Failed to load session:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateSession = async (newSession: Session) => {
        try {
            await AsyncStorage.setItem('session', JSON.stringify(newSession));
            setSession(newSession);
        } catch (error) {
            console.error('Failed to update session:', error);
        }
    };

    const clearSession = async () => {
        try {
            await AsyncStorage.removeItem('session');
            setSession(null);
        } catch (error) {
            console.error('Failed to clear session:', error);
        }
    };

    return { session, loading, updateSession, clearSession };
}
