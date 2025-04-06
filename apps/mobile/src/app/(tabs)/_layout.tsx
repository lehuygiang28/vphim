import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '@ui-kitten/components';
import { Home, User } from 'lucide-react-native';

import AppHeader from '~mb/components/app-header';

export default function TabsLayout() {
    const theme = useTheme();

    return (
        <Tabs
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    switch (route.name) {
                        case 'index':
                            return <Home size={size} color={color} />;
                        case 'account':
                            return <User size={size} color={color} />;
                    }
                },
                tabBarActiveTintColor: theme['color-primary-500'],
                tabBarInactiveTintColor: theme['text-hint-color'],
                tabBarStyle: {
                    backgroundColor: theme['background-basic-color-1'],
                },
                header: () => (route.name !== 'account' ? <AppHeader /> : null),
            })}
        >
            <Tabs.Screen name="index" options={{ title: 'Trang Chủ' }} />
            <Tabs.Screen name="account" options={{ title: 'Cá Nhân' }} />
        </Tabs>
    );
}
