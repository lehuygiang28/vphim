import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CrudFilters, useList } from '@refinedev/core';
import { Layout, Spinner, Text } from '@ui-kitten/components';
import { router } from 'expo-router';

import type { MovieType } from 'apps/api/src/app/movies/movie.type';
import { MOVIES_LIST_QUERY } from '@/queries/movies';
import { MovieAsset } from '@/types/movie-asset.type';
import { MovieSection } from './movie-section';

export type MovieRelatedProps = {
    movie: MovieType;
};

export function MovieRelated({ movie }: MovieRelatedProps) {
    const asset: MovieAsset = {
        filters: [
            ...(movie?.categories && movie?.categories?.length > 0
                ? ([
                      {
                          field: 'categories',
                          operator: 'in',
                          value: movie?.categories?.map((item) => item.slug).join(','),
                      },
                  ] satisfies CrudFilters)
                : []),
            ...(movie?.type
                ? ([
                      {
                          field: 'type',
                          operator: 'eq',
                          value: movie?.type,
                      },
                  ] satisfies CrudFilters)
                : []),
            ...(!movie?.categories
                ? ([
                      {
                          field: 'actors',
                          operator: 'in',
                          value: movie?.actors?.map((item) => item.name).join(','),
                      },
                  ] satisfies CrudFilters)
                : []),
        ],
        sorters: [
            {
                field: 'view',
                order: 'desc',
            },
        ],
    };

    const { data: movies, isLoading } = useList<MovieType>({
        dataProviderName: 'graphql',
        resource: 'movies',
        meta: { gqlQuery: MOVIES_LIST_QUERY, operation: 'movies' },
        pagination: {
            current: 1,
            pageSize: 12,
            mode: 'server',
        },
        ...asset,
    });

    const onMoviePress = (movie: MovieType) => {
        router.push(`/movie/${movie.slug}`);
    };

    if (isLoading) {
        return (
            <Layout style={styles.loadingContainer}>
                <Spinner size="large" />
            </Layout>
        );
    }

    if (!movies || movies.data.length === 0) {
        return (
            <Layout style={styles.emptyContainer}>
                <Text category="s1">Không có phim liên quan.</Text>
            </Layout>
        );
    }

    return (
        <View style={styles.container}>
            <MovieSection
                title="Phim Liên Quan"
                movies={movies.data}
                onMoviePress={onMoviePress}
                sectionStyle={styles.section}
                sectionTitleStyle={styles.sectionTitle}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    section: {
        marginTop: 10,
    },
    sectionTitle: {
        marginBottom: 10,
        marginStart: 10,
    },
});
