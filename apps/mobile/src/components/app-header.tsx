import React, { useState } from 'react';
import { Image } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Appbar, Searchbar } from 'react-native-paper';
import { CustomDarkTheme } from '~mb/config/theme';

const Logo = () => (
    <Image
        source={{ uri: 'https://vephim.vercel.app/assets/images/logo-mini.png' }}
        style={{ width: 80, height: 80 }}
        resizeMode="contain"
    />
);

const AppHeader = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const pathname = usePathname();

    const isExploreScreen = pathname === '/explore';

    return (
        <Appbar.Header style={{ backgroundColor: CustomDarkTheme.colors.surface }}>
            <Appbar.Content title={<Logo />} titleStyle={{ alignSelf: 'center' } as any} />
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
                        router.push({ pathname: '/explore', params: { searchQuery } });
                        setSearchQuery('');
                    }}
                />
            )}
        </Appbar.Header>
    );
};

export default AppHeader;
