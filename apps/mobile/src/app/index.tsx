import React, { useState } from 'react';
import { Platform, StatusBar, Image } from 'react-native';
import { NavigationContainer, useRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DataProvider, Refine } from '@refinedev/core';
import { Provider as PaperProvider, Appbar, Searchbar } from 'react-native-paper';
import { ReactNavigationThemeProvider } from '@refinenative/react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { graphqlDataProvider, restfulDataProvider } from '~fe/providers/data-provider';
import { CustomDarkTheme } from '~mb/config/theme';

import { useAxiosAuth } from '../hooks/useAxiosAuth';
import HomeScreen from './home';
import ExploreScreen from './explore';
import AccountScreen from './account';
import MovieDetailsScreen from './movie';

type RootStackParamList = {
    MainTabs: undefined;
    MovieDetails: { slug: string };
};

type TabParamList = {
    Home: undefined;
    Explore: { searchQuery?: string };
    Account: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const Logo = () => (
    <Image
        source={{ uri: 'https://vephim.vercel.app/assets/images/logo-mini.png' }}
        style={{ width: 80, height: 80 }}
        resizeMode="contain"
    />
);

const AppHeader = ({ navigation }: { navigation: any }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const route = useRoute();

    const isExploreScreen = route.name === 'Explore';

    return (
        <Appbar.Header style={{ backgroundColor: CustomDarkTheme.colors.surface }}>
            <Appbar.Content title={(<Logo />) as any} titleStyle={{ alignSelf: 'center' } as any} />
            {!isExploreScreen && (
                <Searchbar
                    placeholder="Search movies"
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={{
                        flex: 1,
                        marginHorizontal: 16,
                        backgroundColor: CustomDarkTheme.colors.surfaceVariant,
                        height: 36,
                        maxWidth: '70%',
                    }}
                    inputStyle={{ fontSize: 14, alignSelf: 'center' }}
                    onSubmitEditing={() => {
                        navigation.navigate('Explore', { searchQuery });
                        setSearchQuery('');
                    }}
                />
            )}
        </Appbar.Header>
    );
};

function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route, navigation }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Explore') {
                        iconName = focused ? 'compass' : 'compass-outline';
                    } else if (route.name === 'Account') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName as never} size={size} color={color} />;
                },
                tabBarActiveTintColor: CustomDarkTheme.colors.primary,
                tabBarInactiveTintColor: CustomDarkTheme.colors.onSurfaceVariant,
                tabBarStyle: {
                    backgroundColor: CustomDarkTheme.colors.surface,
                },
                header: () => <AppHeader navigation={navigation} />,
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Explore" component={ExploreScreen} />
            <Tab.Screen name="Account" component={AccountScreen} />
        </Tab.Navigator>
    );
}

export default function App() {
    const axiosAuth = useAxiosAuth({ baseURL: process.env.EXPO_PUBLIC_BASE_API_URL });

    return (
        <Refine
            dataProvider={{
                default: restfulDataProvider(axiosAuth) as DataProvider,
                graphql: graphqlDataProvider(axiosAuth, {
                    publicApiUrl: process.env.EXPO_PUBLIC_BASE_API_URL,
                }) as DataProvider,
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
            <ReactNavigationThemeProvider theme={CustomDarkTheme}>
                <PaperProvider theme={CustomDarkTheme}>
                    <NavigationContainer>
                        <Stack.Navigator>
                            <Stack.Screen
                                name="MainTabs"
                                component={TabNavigator}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="MovieDetails"
                                component={MovieDetailsScreen}
                                options={{ headerShown: false }}
                            />
                        </Stack.Navigator>
                    </NavigationContainer>
                    <StatusBar barStyle="light-content" />
                </PaperProvider>
            </ReactNavigationThemeProvider>
        </Refine>
    );
}
