import { FlatList, StyleProp, TextStyle, View, ViewStyle } from 'react-native';
import { useTheme, Text } from '@ui-kitten/components';

import { MovieType } from '~api/app/movies/movie.type';

import { MovieCard } from '~mb/components/card/movie-card';

export const MovieSection = ({
    title,
    movies,
    onMoviePress,
    sectionStyle,
    sectionTitleStyle,
}: {
    title: string;
    movies: MovieType[];
    onMoviePress: (movie: MovieType) => void;
    sectionStyle?: StyleProp<ViewStyle>;
    sectionTitleStyle?: StyleProp<TextStyle>;
}) => {
    const theme = useTheme();

    return (
        <View style={sectionStyle}>
            <Text category="h5" style={[{ color: theme['color-primary-500'] }, sectionTitleStyle]}>
                {title}
            </Text>
            <FlatList
                data={movies}
                renderItem={({ item }) => (
                    <MovieCard movie={item} onPress={() => onMoviePress(item)} />
                )}
                keyExtractor={(item) => item._id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
            />
        </View>
    );
};
