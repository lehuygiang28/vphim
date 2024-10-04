'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { CrudFilter, CrudSort, stringifyTableParams, useList } from '@refinedev/core';
import { Grid } from 'antd';
import { DocumentNode } from 'graphql';
import { LoadingSpinner } from '@/components/loading';

const MovieList = dynamic(() => import('@/components/swiper/movie-list'));

import type { MovieResponseDto } from 'apps/api/src/app/movies/dtos';
import { MOVIES_LIST_QUERY } from '@/queries/movies';
import { RouteNameEnum } from '@/constants/route.constant';
import { slugifyVietnamese } from '@/libs/utils/movie.util';

const { useBreakpoint } = Grid;
type MovieAsset = {
    filters: CrudFilter[];
    sorters: CrudSort[];
};
interface LazyMovieListProps {
    title: string;
    movieAsset: MovieAsset;
    activeList: string | null;
    setActiveList: React.Dispatch<React.SetStateAction<string | null>>;
    gqlQuery?: DocumentNode;
}

export default function LazyMovieList({
    title,
    movieAsset,
    activeList,
    setActiveList,
    gqlQuery = MOVIES_LIST_QUERY,
}: LazyMovieListProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const { md } = useBreakpoint();
    const slugTitle = slugifyVietnamese(title);

    useEffect(() => {
        const currentRef = ref.current;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                rootMargin: '100px', // Start loading when the component is 100px from entering the viewport
            },
        );

        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, []);

    const { data: movies, isLoading } = useList<MovieResponseDto>({
        dataProviderName: 'graphql',
        meta: { gqlQuery },
        resource: 'movies',
        pagination: {
            pageSize: 12,
        },
        ...movieAsset,
        queryOptions: {
            enabled: isVisible,
            onSuccess: () => setIsLoaded(true),
        },
    });

    return (
        <div
            ref={ref}
            style={{
                marginBottom: md ? '4rem' : '3.5rem',
                marginLeft: md ? '3rem' : '0.7rem',
                marginRight: md ? '3rem' : '0.7rem',
                minHeight: '200px', // Prevent layout shift
            }}
            onClick={() => setActiveList(slugTitle)}
        >
            {isVisible &&
                (isLoading ? (
                    <LoadingSpinner />
                ) : (
                    isLoaded && (
                        <MovieList
                            clearVisibleContentCard={activeList != slugTitle}
                            title={title}
                            movies={movies?.data}
                            viewMoreHref={`${RouteNameEnum.MOVIE_LIST_PAGE}?${stringifyTableParams(
                                movieAsset,
                            )}`}
                        />
                    )
                ))}
        </div>
    );
}
