'use client';

import React, { useState, useEffect, ReactNode, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Divider, Space, Breadcrumb, Empty, Row, Col, Pagination, Spin } from 'antd';
import { useTable, CrudSort, CrudFilters, useIsAuthenticated } from '@refinedev/core';
import { parseTableParams } from '@refinedev/nextjs-router';
import { motion } from 'framer-motion';
import { LoadingOutlined } from '@ant-design/icons';

import type { MovieType } from 'apps/api/src/app/movies/movie.type';

import { sortedStringify } from '@/libs/utils/common';
import { MOVIES_LIST_QUERY } from '@/queries/movies';
import { MovieCard } from '@/components/card/movie-card';
import { MovieFilters } from './movie-filter';
import AISearchSteps from './ai-search-steps';

import type { Category } from 'apps/api/src/app/categories/category.schema';
import type { Region } from 'apps/api/src/app/regions/region.schema';

export type LocalQuery = {
    pagination: {
        current: number | undefined;
        pageSize: number | undefined;
    };
    filters?: CrudFilters | undefined;
    sorters?: CrudSort[] | undefined;
    useAI?: boolean;
};

export type MoviePageProps = {
    breadcrumbs: { label: string | ReactNode; url?: string }[];
    categories: Category[];
    regions: Region[];
};

const PAGE_SIZE = 24;

// Optimized animation variants
const movieItemVariants = {
    hidden: {
        opacity: 0,
        y: 15, // Reduced movement for better performance
        scale: 0.98, // Less scaling for better performance
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: 'tween',
            duration: 0.25, // Slightly faster animations
            ease: [0.25, 0.1, 0.25, 1.0], // Custom cubic bezier for smoother motion
        },
    },
    exit: {
        opacity: 0,
        y: -5, // Simplified exit animation
        transition: {
            duration: 0.15, // Faster exit for better performance
        },
    },
};

// Performance-optimized batch configuration
const REVEAL_BATCH_SIZE = 6; // Increased batch size to reduce updates
const REVEAL_BATCH_DELAY = 120; // Faster delay between batches

export default function MoviePage({ breadcrumbs, categories, regions }: MoviePageProps) {
    const search = useSearchParams();
    const currentSearchString = search?.toString() || '';
    const [parsedQuery, setParsedQuery] = useState(parseTableParams(currentSearchString));
    const [query, setQuery] = useState<undefined | LocalQuery>(undefined);
    const { data: authData } = useIsAuthenticated();
    const isLoggedIn = authData?.authenticated || false;
    const [showResults, setShowResults] = useState(false);
    // Track when AI search is active
    const [isAISearchActive, setIsAISearchActive] = useState(false);
    // Track if the current loading is for pagination/filter change (not AI search)
    const [isChangingPage, setIsChangingPage] = useState(false);

    // Animation state management
    const animationStateRef = useRef({
        isRevealing: false,
        revealedCount: 0,
        isComplete: true,
    });
    const [_, setRevealTrigger] = useState(0);

    // Use refs for animation frame management
    const frameIdRef = useRef<number | null>(null);
    const batchTimersRef = useRef<number[]>([]);

    const {
        tableQuery: { data, isLoading, isRefetching },
        sorters,
        setSorters,
        filters,
        setFilters,
        current,
        setCurrent,
    } = useTable<MovieType>({
        dataProviderName: 'graphql',
        resource: 'movies',
        syncWithLocation: true,
        meta: {
            gqlQuery: MOVIES_LIST_QUERY,
        },
        filters: {
            mode: 'server',
            defaultBehavior: 'replace',
            initial: parsedQuery?.filters?.length > 0 ? parsedQuery.filters : [],
        },
        pagination: {
            mode: 'server',
            current: parsedQuery?.pagination.current || 1,
            pageSize: PAGE_SIZE,
        },
        sorters: {
            mode: 'server',
            initial:
                parsedQuery?.sorters?.length > 0
                    ? parsedQuery.sorters
                    : [{ field: 'view', order: 'desc' }],
        },
    });

    // Handle loading state
    useEffect(() => {
        if (isLoading || isRefetching) {
            // Show results immediately except for AI search
            setShowResults(!isAISearchActive || isChangingPage);

            // Reset animation state
            animationStateRef.current = {
                isRevealing: false,
                revealedCount: 0,
                isComplete: false,
            };

            // Clear animations
            if (frameIdRef.current !== null) {
                cancelAnimationFrame(frameIdRef.current);
                frameIdRef.current = null;
            }

            batchTimersRef.current.forEach(window.clearTimeout);
            batchTimersRef.current = [];
        }
    }, [isLoading, isRefetching, isAISearchActive, isChangingPage]);

    // Handle URL params changes
    useEffect(() => {
        if (search) {
            const parsed = parseTableParams(search.toString());
            if (sortedStringify(parsed) !== sortedStringify(parsedQuery)) {
                setParsedQuery({
                    ...parsed,
                    pagination: { ...parsed?.pagination, pageSize: PAGE_SIZE },
                });

                // Check if only pagination is changing
                const isPaginationChange =
                    sortedStringify(parsed?.filters) === sortedStringify(parsedQuery?.filters) &&
                    sortedStringify(parsed?.sorters) === sortedStringify(parsedQuery?.sorters) &&
                    parsed?.pagination?.current !== parsedQuery?.pagination?.current;

                setIsChangingPage(isPaginationChange);
                setFilters(parsed?.filters || []);
                setSorters(parsed?.sorters || []);
                setCurrent(Number(parsed?.pagination?.current) || 1);
            }
        }
    }, [search]);

    // Update local query state
    useEffect(() => {
        setQuery((prev) => ({
            ...prev,
            pagination: {
                ...prev?.pagination,
                current: current,
                pageSize: PAGE_SIZE,
            },
            filters,
            sorters,
        }));
    }, [filters, sorters, current]);

    // Animation effect
    useEffect(() => {
        if (
            !isLoading &&
            !isRefetching &&
            data?.data &&
            !animationStateRef.current.isRevealing &&
            !animationStateRef.current.isComplete
        ) {
            const totalItems = data.data.length;

            if (totalItems === 0) {
                animationStateRef.current.isComplete = true;
                setRevealTrigger((prev) => prev + 1); // Trigger a single rerender
                return;
            }

            // Mark that we're starting to reveal
            animationStateRef.current.isRevealing = true;

            // Calculate number of batches
            const batchCount = Math.ceil(totalItems / REVEAL_BATCH_SIZE);

            // Setup requestAnimationFrame for smoother animation scheduling
            const scheduleNextBatch = (batchIndex: number) => {
                if (batchIndex >= batchCount) return;

                const timer = window.setTimeout(() => {
                    frameIdRef.current = requestAnimationFrame(() => {
                        const nextRevealedCount = Math.min(
                            (batchIndex + 1) * REVEAL_BATCH_SIZE,
                            totalItems,
                        );

                        animationStateRef.current = {
                            revealedCount: nextRevealedCount,
                            isComplete: nextRevealedCount >= totalItems,
                            isRevealing: nextRevealedCount < totalItems,
                        };

                        setRevealTrigger((prev) => prev + 1);

                        // Schedule next batch if needed
                        if (nextRevealedCount < totalItems) {
                            scheduleNextBatch(batchIndex + 1);
                        }
                    });
                }, REVEAL_BATCH_DELAY);

                batchTimersRef.current.push(timer);
            };

            scheduleNextBatch(0);

            return () => {
                if (frameIdRef.current !== null) {
                    cancelAnimationFrame(frameIdRef.current);
                    frameIdRef.current = null;
                }

                batchTimersRef.current.forEach(window.clearTimeout);
                batchTimersRef.current = [];
            };
        }
    }, [data?.data, isLoading, isRefetching]);

    // Search handler
    const applySearch = useCallback(
        (localQuery: LocalQuery) => {
            if (localQuery) {
                // Reset the changing page flag
                setIsChangingPage(false);

                // Check if AI search is enabled for this search
                setIsAISearchActive(!!localQuery.useAI);

                const currentPage = localQuery.pagination?.current || 1;

                // Apply search parameters
                setFilters(localQuery?.filters || []);
                setSorters(localQuery?.sorters || []);
                setCurrent(currentPage);

                // Reset animation state when starting a new search
                animationStateRef.current = {
                    isRevealing: false,
                    revealedCount: 0,
                    isComplete: false,
                };

                setRevealTrigger((prev) => prev + 1);
            }
        },
        [setFilters, setSorters, setCurrent],
    );

    const handleSearchCompleted = useCallback(() => {
        setShowResults(true);
    }, []);

    // Memoized values
    const enhancedBreadcrumbs = useMemo(() => {
        return breadcrumbs.map((item) => {
            if (item.url === '/danh-sach-phim' && currentSearchString) {
                return {
                    ...item,
                    url: `/danh-sach-phim?${currentSearchString}`,
                };
            }
            return item;
        });
    }, [breadcrumbs, currentSearchString]);

    const hasSearchResults = !!data?.data && data.data.length > 0;

    const shouldShowAISteps = useMemo(() => {
        return (
            isAISearchActive &&
            !isChangingPage &&
            (isLoading || isRefetching || (!showResults && hasSearchResults))
        );
    }, [isAISearchActive, isChangingPage, isLoading, isRefetching, showResults, hasSearchResults]);

    const responsiveSpan = useMemo(() => {
        return {
            xs: 12, // 2 items per row on very small screens
            sm: 12, // 2 items per row on small screens
            md: 8, // 3 items per row on medium screens
            lg: 6, // 4 items per row on large screens
            xl: 4, // 6 items per row on extra large screens
            xxl: 3, // 8 items per row on extra extra large screens
        };
    }, []);

    // Determine what to display
    const showLoadingState = isLoading || isRefetching;
    const showEmptyState = !showLoadingState && !hasSearchResults;
    const showResultsGrid =
        !showLoadingState && hasSearchResults && (!isAISearchActive || showResults);

    return (
        <div style={{ width: '100%' }}>
            <Space direction="vertical" size={0} style={{ width: '100%' }}>
                <Breadcrumb>
                    {enhancedBreadcrumbs.map((item, index) => (
                        <Breadcrumb.Item key={`breadcrumb-movies-page-${index}`}>
                            {item.url ? <Link href={item.url}>{item.label}</Link> : item.label}
                        </Breadcrumb.Item>
                    ))}
                </Breadcrumb>
                <Divider />

                <MovieFilters
                    query={query}
                    setQuery={setQuery}
                    isSearching={showLoadingState}
                    applySearch={applySearch}
                    categories={categories}
                    regions={regions}
                    isLoggedIn={isLoggedIn}
                />
                <Divider />

                {shouldShowAISteps && (
                    <AISearchSteps
                        isLoading={isLoading}
                        isRefetching={isRefetching}
                        hasData={hasSearchResults}
                        onCompleted={handleSearchCompleted}
                    />
                )}

                {showLoadingState && (
                    <div
                        style={{
                            minHeight: '300px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '100%',
                        }}
                    >
                        <Spin
                            indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
                            tip={isChangingPage ? 'Đang thay đổi trang...' : 'Đang tải...'}
                        />
                    </div>
                )}

                {showEmptyState && (
                    <div
                        style={{
                            minHeight: '300px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Empty description="Không tìm thấy phim" />
                    </div>
                )}

                {showResultsGrid && (
                    <>
                        <Row gutter={[16, 54]}>
                            {data?.data?.map((item, index) => (
                                <Col
                                    {...responsiveSpan}
                                    key={item._id ? item._id.toString() : `movie-${index}`}
                                >
                                    <motion.div
                                        variants={movieItemVariants}
                                        initial="hidden"
                                        animate={
                                            index < animationStateRef.current.revealedCount
                                                ? 'visible'
                                                : 'hidden'
                                        }
                                        exit="exit"
                                        layout="position"
                                        style={{
                                            willChange: 'transform, opacity',
                                            backfaceVisibility: 'hidden',
                                            transform: 'translateZ(0)',
                                        }}
                                    >
                                        <MovieCard movie={item} fromParam={currentSearchString} />
                                    </motion.div>
                                </Col>
                            ))}
                        </Row>

                        {data?.total && data.total > PAGE_SIZE && (
                            <div
                                style={{
                                    marginTop: '4rem',
                                    display: 'flex',
                                    justifyContent: 'center',
                                }}
                            >
                                <Pagination
                                    current={current}
                                    pageSize={PAGE_SIZE}
                                    total={data?.total ?? data?.data?.length}
                                    showSizeChanger={false}
                                    onChange={(page) => {
                                        setIsChangingPage(true);
                                        setCurrent(page);
                                    }}
                                />
                            </div>
                        )}
                    </>
                )}
            </Space>
        </div>
    );
}
