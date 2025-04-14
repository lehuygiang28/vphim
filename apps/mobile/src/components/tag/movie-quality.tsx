import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, ThemeType, useTheme } from '@ui-kitten/components';
import { MovieQualityEnum } from 'apps/api/src/app/movies/movie.constant';

interface MovieQualityTagProps {
    quality?: string;
    size?: 'small' | 'medium' | 'large';
}

export const getQualityColor = (quality: string, theme: ThemeType): string => {
    switch (quality) {
        case MovieQualityEnum._4K:
            return theme['color-primary-400'];
        case MovieQualityEnum.FHD:
            return theme['color-success-500'];
        case MovieQualityEnum.HD:
            return theme['color-info-500'];
        case MovieQualityEnum.SD:
            return theme['color-info-400'];
        case MovieQualityEnum.CAM:
            return theme['color-warning-500'];
        default:
            return theme['color-basic-500'];
    }
};

export const formatQuality = (quality: string): string => {
    return quality.toUpperCase();
};

export const MovieQualityTag: React.FC<MovieQualityTagProps> = ({ quality, size = 'medium' }) => {
    const theme = useTheme();

    if (!quality) return null;

    const getFontSize = (): number => {
        switch (size) {
            case 'small':
                return 10;
            case 'large':
                return 14;
            case 'medium':
            default:
                return 12;
        }
    };

    const getPadding = (): number => {
        switch (size) {
            case 'small':
                return 4;
            case 'large':
                return 8;
            case 'medium':
            default:
                return 6;
        }
    };

    return (
        <View
            style={[
                styles.tag,
                {
                    backgroundColor: getQualityColor(quality, theme),
                    paddingVertical: getPadding() / 2,
                    paddingHorizontal: getPadding(),
                },
            ]}
        >
            <Text
                style={[
                    styles.text,
                    {
                        fontSize: getFontSize(),
                    },
                ]}
            >
                {formatQuality(quality)}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    tag: {
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    text: {
        color: 'white',
        fontWeight: 'bold',
    },
});
