import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CustomDarkTheme } from '~mb/config/theme';
import AppHeader from '../../components/app-header';

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'index') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'explore') {
                        iconName = focused ? 'compass' : 'compass-outline';
                    } else if (route.name === 'account') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName as any} size={size} color={color} />;
                },
                tabBarActiveTintColor: CustomDarkTheme.colors.primary,
                tabBarInactiveTintColor: CustomDarkTheme.colors.onSurfaceVariant,
                tabBarStyle: {
                    backgroundColor: CustomDarkTheme.colors.surface,
                },
                header: () => <AppHeader />,
            })}
        >
            <Tabs.Screen name="index" options={{ title: 'Home' }} />
            <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
            <Tabs.Screen name="account" options={{ title: 'Account' }} />
        </Tabs>
    );
}
