import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, ThemeType, useTheme } from '@ui-kitten/components';
import { MovieContentRatingEnum } from 'apps/api/src/app/movies/movie.constant';

interface MovieContentRatingProps {
    rating?: string;
    size?: 'small' | 'medium' | 'large';
}

export const getRatingColor = (rating: string, theme: ThemeType): string => {
    switch (rating) {
        case MovieContentRatingEnum.P:
            return theme['color-success-500'];
        case MovieContentRatingEnum.K:
            return theme['color-success-400'];
        case MovieContentRatingEnum.T13:
            return theme['color-info-500'];
        case MovieContentRatingEnum.T16:
            return theme['color-warning-500'];
        case MovieContentRatingEnum.T18:
            return theme['color-warning-600'];
        case MovieContentRatingEnum.C:
            return theme['color-danger-500'];
        default:
            return theme['color-basic-500'];
    }
};

export const getFormattedRating = (rating: string): string => {
    return rating.toUpperCase();
};

export const MovieContentRating: React.FC<MovieContentRatingProps> = ({
    rating,
    size = 'medium',
}) => {
    const theme = useTheme();

    if (!rating) return null;

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
                    backgroundColor: getRatingColor(rating, theme),
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
                {getFormattedRating(rating)}
            </Text>
        </View>
    );
};

export const getContentRatingDescription = (rating?: string): string => {
    if (!rating) return 'Nội dung yêu cầu xác nhận độ tuổi trước khi xem.';

    switch (rating.toUpperCase()) {
        case MovieContentRatingEnum.P:
            return 'Nội dung phù hợp với mọi lứa tuổi.';
        case MovieContentRatingEnum.K:
            return 'Nội dung dành cho trẻ em, có thể cần sự hướng dẫn của người lớn.';
        case MovieContentRatingEnum.T13:
            return 'Nội dung dành cho người xem từ 13 tuổi trở lên.';
        case MovieContentRatingEnum.T16:
            return 'Nội dung dành cho người xem từ 16 tuổi trở lên.';
        case MovieContentRatingEnum.T18:
            return 'Nội dung chỉ dành cho người trưởng thành, từ 18 tuổi trở lên.';
        case MovieContentRatingEnum.C:
            return 'Nội dung bị hạn chế, không phù hợp cho phổ biến rộng rãi.';
        default:
            return 'Nội dung yêu cầu xác nhận độ tuổi trước khi xem.';
    }
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
