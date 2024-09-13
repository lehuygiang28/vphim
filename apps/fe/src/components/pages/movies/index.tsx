'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Divider, Space, Typography, Breadcrumb, List, Grid, Empty } from 'antd';
import {
    CrudFilter,
    useTable,
    parseTableParams,
    useRouterContext,
    LogicalFilter,
} from '@refinedev/core';
import { MOVIES_LIST_QUERY } from '@/queries/movies';
import { MovieCard } from '@/components/card/movie-card';
import { MovieFilters } from './movie-filter';

import type { MovieType } from 'apps/api/src/app/movies/movie.type';

const { Title } = Typography;
const { useBreakpoint } = Grid;

export type MoviePageProps = {
    breadcrumbs: { label: string; url?: string }[];
};

export default function MoviePage({ breadcrumbs }: MoviePageProps) {
    const { md } = useBreakpoint();

    const { useLocation } = useRouterContext();
    const { search } = useLocation();
    const { parsedCurrent, parsedPageSize, parsedSorter, parsedFilters } = parseTableParams(
        search ?? '?',
    );

    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [localFilters, setLocalFilters] = useState<CrudFilter[]>([
        {
            field: 'years',
            operator: 'in',
            value: `${new Date().getFullYear()}`,
        },
    ]);
    const [localSorter, setLocalSorter] = useState<{ field: string; order: 'asc' | 'desc' }>({
        field: 'view',
        order: 'desc',
    });

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
        meta: {
            gqlQuery: MOVIES_LIST_QUERY,
        },
        filters: {
            mode: 'server',
            defaultBehavior: 'replace',
            initial: parsedFilters || [],
        },
        pagination: {
            mode: 'server',
            current: parsedCurrent || 1,
            pageSize: Math.min(parsedPageSize || 24, 24),
        },
        sorters: {
            mode: 'server',
            initial: parsedSorter || [{ field: 'view', order: 'desc' }],
        },
    });

    useEffect(() => {
        setLocalFilters(filters);
        setLocalSorter(sorters?.[0]);
    }, [filters, sorters]);

    const handleVisibleContentCard = (index: number | null) => {
        setSelectedIndex(index === selectedIndex ? null : index);
    };

    const handleFilterChange = (key: string, value: any) => {
        let newFilters = localFilters?.filter((x) => (x as LogicalFilter)?.field !== key);

        if (value !== undefined && value !== null) {
            newFilters = [
                ...newFilters,
                {
                    field: key,
                    value: Array.isArray(value) ? value.join(',') : value,
                    operator: Array.isArray(value) ? 'in' : 'eq',
                },
            ];
        }
        setLocalFilters(newFilters);
    };

    const handleSorterChange = (value: string) => {
        setLocalSorter({ field: value, order: 'desc' });
    };

    const applyFilters = () => {
        setFilters(localFilters);
        setSorters([localSorter]);
        setCurrent(1);
    };

    return (
        <div style={{ width: '100%' }}>
            <Space direction="vertical" size={0} style={{ width: '100%' }}>
                <Breadcrumb>
                    {breadcrumbs.map((item) => (
                        <Breadcrumb.Item key={item.label}>
                            {item.url ? <Link href={item.url}>{item.label}</Link> : item.label}
                        </Breadcrumb.Item>
                    ))}
                </Breadcrumb>
                <Divider />
                <MovieFilters
                    localFilters={localFilters}
                    localSorter={localSorter}
                    onFilterChange={handleFilterChange}
                    onSorterChange={handleSorterChange}
                    onApplyFilters={applyFilters}
                />
                <Divider />
                <List
                    loading={isLoading || isRefetching}
                    grid={{
                        gutter: [16, 36],
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
                                onClick={() => handleVisibleContentCard(index)}
                                onMouseEnter={() => handleVisibleContentCard(index)}
                                onMouseLeave={() => handleVisibleContentCard(null)}
                            >
                                <MovieCard
                                    movie={item}
                                    visibleContent={selectedIndex === index}
                                    scale={md ? undefined : 1.1}
                                />
                                <Title level={5} style={{ lineHeight: '1rem' }}>
                                    {item.name && item.name?.length > 50
                                        ? item.name?.slice(0, 50) + '...'
                                        : item.name}
                                </Title>
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
