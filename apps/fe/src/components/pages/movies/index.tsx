'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Divider, Space, Breadcrumb, List, Grid, Empty } from 'antd';
import { useTable, CrudSort, CrudFilters } from '@refinedev/core';
import { parseTableParams } from '@refinedev/nextjs-router';
import { MOVIES_LIST_QUERY } from '@/queries/movies';
import { MovieCard } from '@/components/card/movie-card';
import { MovieFilters } from './movie-filter';

import type { MovieType } from 'apps/api/src/app/movies/movie.type';
import { sortedStringify } from 'apps/api/src/libs/utils/common';

const { useBreakpoint } = Grid;

export type LocalQuery = {
    pagination: {
        current: number | undefined;
        pageSize: number | undefined;
    };
    filters?: CrudFilters | undefined;
    sorters?: CrudSort[] | undefined;
};

export type MoviePageProps = {
    breadcrumbs: { label: string | ReactNode; url?: string }[];
};

export default function MoviePage({ breadcrumbs }: MoviePageProps) {
    const router = useRouter();
    const { md } = useBreakpoint();
    const search = useSearchParams();
    const [parsedQuery, setParsedQuery] = useState(parseTableParams(search?.toString()));
    const [query, setQuery] = useState<undefined | LocalQuery>(undefined);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const {
        tableQuery: { data, isLoading, isRefetching },
        sorters,
        setSorters,
        filters,
        setFilters,
        current,
        setCurrent,
        pageSize,
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
            initial:
                parsedQuery?.filters && parsedQuery?.filters?.length > 0
                    ? parsedQuery?.filters
                    : [],
        },
        pagination: {
            mode: 'server',
            current: parsedQuery?.pagination.current || 1,
            pageSize: Math.min(parsedQuery?.pagination.pageSize || 24, 24),
        },
        sorters: {
            mode: 'server',
            initial:
                parsedQuery?.sorters && parsedQuery?.sorters?.length > 0
                    ? parsedQuery?.sorters
                    : [{ field: 'view', order: 'desc' }],
        },
    });

    useEffect(() => {
        if (search) {
            const parsed = parseTableParams(search?.toString());
            if (sortedStringify(parsed) !== sortedStringify(parsedQuery)) {
                setParsedQuery(parsed);
                setFilters(parsed?.filters || []);
                setSorters(parsed?.sorters || []);
                setCurrent(Number(parsed?.pagination?.current) || 1);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    useEffect(() => {
        if (current) {
            setQuery((prev) => ({
                ...prev,
                pagination: { ...prev?.pagination, current: current },
            }));
        }

        if (pageSize) {
            setQuery((prev) => ({
                ...prev,
                pagination: { ...prev?.pagination, pageSize: pageSize },
            }));
        }

        if (filters) {
            setQuery((prev) => ({ ...prev, filters: filters }));
        }

        if (sorters) {
            setQuery((prev) => ({ ...prev, sorters: sorters }));
        }
    }, [filters, sorters, current, pageSize]);

    const handleVisibleContentCard = (index: number | null) => {
        setSelectedIndex(index === selectedIndex ? null : index);
    };

    const applySearch = (localQuery: LocalQuery) => {
        if (localQuery) {
            setFilters(localQuery?.filters || []);
            setSorters(localQuery?.sorters || []);
            setCurrent(localQuery?.pagination?.current || 1);
        }
    };

    return (
        <div style={{ width: '100%' }}>
            <Space direction="vertical" size={0} style={{ width: '100%' }}>
                <Breadcrumb>
                    {breadcrumbs.map((item, index) => (
                        <Breadcrumb.Item key={`breadcrumb-movies-page-${index}`}>
                            {item.url ? <Link href={item.url}>{item.label}</Link> : item.label}
                        </Breadcrumb.Item>
                    ))}
                </Breadcrumb>
                <Divider />
                <MovieFilters
                    query={query}
                    setQuery={setQuery}
                    isSearching={isLoading || isRefetching}
                    applySearch={applySearch}
                />
                <Divider />
                <List
                    loading={isLoading || isRefetching}
                    grid={{
                        gutter: [16, 54],
                        xs: 2,
                        sm: 2,
                        md: 3,
                        lg: 4,
                        xl: 6,
                        xxl: 8,
                    }}
                    locale={{
                        emptyText: (
                            <>
                                <Empty description="Không tìm thấy phim" />
                            </>
                        ),
                    }}
                    dataSource={data?.data}
                    renderItem={(item: MovieType, index) => (
                        <List.Item>
                            <div
                                style={{
                                    height: md ? '19rem' : '17rem',
                                    zIndex: index === selectedIndex ? '100' : '1',
                                }}
                                onClick={() => {
                                    if (md) {
                                        router.push(`/phim/${item.slug}`);
                                    } else {
                                        handleVisibleContentCard(index);
                                    }
                                }}
                                onMouseEnter={() => handleVisibleContentCard(index)}
                                onMouseLeave={() => handleVisibleContentCard(null)}
                            >
                                <MovieCard
                                    movie={item}
                                    visibleContent={selectedIndex === index}
                                    scale={md ? undefined : 1.1}
                                />
                            </div>
                        </List.Item>
                    )}
                    pagination={
                        isLoading || data?.data?.length === 0
                            ? false
                            : {
                                  style: { marginTop: '4rem' },
                                  current: current,
                                  pageSize: pageSize,
                                  total: data?.total ?? data?.data?.length,
                                  showSizeChanger: false,
                                  onChange: (page) => setCurrent(page),
                              }
                    }
                />
            </Space>
        </div>
    );
}
