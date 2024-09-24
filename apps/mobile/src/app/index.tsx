import React from 'react';
import { Platform, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { DataProvider, Refine } from '@refinedev/core';
import { DrawerLayout as CustomDrawerContent } from '@refinenative/expo-router';
import { ReactNavigationThemeProvider } from '@refinenative/react-native-paper';

import { graphqlDataProvider, restfulDataProvider } from '~fe/providers/data-provider';
import { useAxiosAuth } from '../hooks/useAxiosAuth';
import HomeScreen from '../components/screens/home';
import MoviesScreen from '../components/screens/movies';

const Drawer = createDrawerNavigator();

export default function App() {
    const axiosAuth = useAxiosAuth({ baseURL: process.env.BASE_API_URL });

    return (
        <Refine
            dataProvider={{
                default: restfulDataProvider(axiosAuth) as DataProvider,
                graphql: graphqlDataProvider(axiosAuth) as DataProvider,
            }}
            resources={[
                {
                    name: 'movies',
                    list: '/movies',
                },
            ]}
            options={{
                reactQuery: {
                    devtoolConfig: Platform.OS === 'web' ? undefined : false,
                },
                disableTelemetry: true,
            }}
        >
            <ReactNavigationThemeProvider>
                <NavigationContainer>
                    <Drawer.Navigator>
                        <Drawer.Screen name="Home" component={HomeScreen} />
                        <Drawer.Screen name="Movies" component={MoviesScreen} />
                    </Drawer.Navigator>
                </NavigationContainer>
                <StatusBar barStyle="dark-content" />
            </ReactNavigationThemeProvider>
        </Refine>
    );
}
