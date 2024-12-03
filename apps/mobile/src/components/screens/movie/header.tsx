import React from 'react';
import { StyleSheet } from 'react-native';
import { TopNavigation, TopNavigationAction, Text, useTheme } from '@ui-kitten/components';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from 'expo-router';

import { truncateText } from '~fe/libs/utils/movie.util';
import { removeStyleProperty } from '~mb/libs/utils';
interface MovieHeaderProps {
    title: string;
}

export default function MovieHeader({ title }: MovieHeaderProps) {
    const theme = useTheme();
    const navigation = useNavigation();

    const renderBackAction = () => (
        <TopNavigationAction
            icon={(props) => (
                <ArrowLeft {...removeStyleProperty(props)} color={theme['text-basic-color']} />
            )}
            onPress={() => navigation.goBack()}
        />
    );

    return (
        <TopNavigation
            title={() => (
                <Text category="h6" ellipsizeMode="tail">
                    {truncateText(title, 30)}
                </Text>
            )}
            alignment="center"
            accessoryLeft={renderBackAction}
            style={styles.topNavigation}
        />
    );
}

const styles = StyleSheet.create({
    topNavigation: {
        backgroundColor: 'transparent',
    },
});
