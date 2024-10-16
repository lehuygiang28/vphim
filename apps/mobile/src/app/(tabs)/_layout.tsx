import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '@ui-kitten/components';
import { Home, Compass, User } from 'lucide-react-native';

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
                        case 'explore':
                            return <Compass size={size} color={color} />;
                        case 'account':
                            return <User size={size} color={color} />;
                    }
                },
                tabBarActiveTintColor: theme['color-primary-500'],
                tabBarInactiveTintColor: theme['text-hint-color'],
                tabBarStyle: {
                    backgroundColor: theme['background-basic-color-1'],
                },
                header: () => <AppHeader />,
            })}
        >
            <Tabs.Screen name="index" options={{ title: 'Home' }} />
            <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
        </Tabs>
    );
}
