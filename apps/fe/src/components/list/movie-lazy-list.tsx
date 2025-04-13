'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

import { CrudFilter, CrudSort, stringifyTableParams, useList } from '@refinedev/core';
import { Grid } from 'antd';
import { DocumentNode } from 'graphql';
import { useInView } from 'react-intersection-observer';

import type { MovieType } from 'apps/api/src/app/movies/movie.type';

const MovieList = dynamic(() => import('@/components/swiper/movie-list'), { ssr: true });
import { LoadingSpinner } from '@/components/loading';
import { MOVIES_LIST_QUERY } from '@/queries/movies';
import { RouteNameEnum } from '@/constants/route.constant';

const { useBreakpoint } = Grid;

type MovieAsset = {
    filters: CrudFilter[];
    sorters: CrudSort[];
};

interface LazyMovieListProps {
    title: string;
    movieAsset: MovieAsset;
    gqlQuery?: DocumentNode;
}

export default function LazyMovieList({
    title,
    movieAsset,
    gqlQuery = MOVIES_LIST_QUERY,
}: LazyMovieListProps) {
    const { md } = useBreakpoint();
    const [isVisible, setIsVisible] = useState(false);
    const [shouldFetch, setShouldFetch] = useState(false);

    const [ref, inView] = useInView({
        triggerOnce: false,
        rootMargin: '400px', // Increased to start loading even earlier
        threshold: 0.1, // Start when 10% of the component is visible
    });

    useEffect(() => {
        if (inView && !shouldFetch) {
            setShouldFetch(true);
        }
    }, [inView, shouldFetch]);

    const { data: movies, isLoading } = useList<MovieType>({
        dataProviderName: 'graphql',
        meta: { gqlQuery },
        resource: 'movies',
        pagination: {
            pageSize: 12,
        },
        ...movieAsset,
        queryOptions: {
            enabled: shouldFetch,
        },
    });

    useEffect(() => {
        if (movies && !isVisible) {
            setIsVisible(true);
        }
    }, [movies, isVisible]);

    return (
        <div
            ref={ref}
            style={{
                marginBottom: md ? '4rem' : '3.5rem',
                marginLeft: md ? '3rem' : '0.7rem',
                marginRight: md ? '3rem' : '0.7rem',
                minHeight: '200px', // Prevent layout shift
            }}
        >
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <MovieList
                    title={title}
                    movies={movies?.data}
                    viewMoreHref={`${RouteNameEnum.MOVIE_LIST_PAGE}?${stringifyTableParams(
                        movieAsset,
                    )}`}
                />
            )}
        </div>
    );
}
