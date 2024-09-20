'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Divider, Space, Typography, Breadcrumb, List, Grid, Empty } from 'antd';
import { CrudFilter, useTable, LogicalFilter, CrudSort } from '@refinedev/core';
import { parseTableParams } from '@refinedev/nextjs-router';
import { MOVIES_LIST_QUERY } from '@/queries/movies';
import { MovieCard } from '@/components/card/movie-card';
import { MovieFilters } from './movie-filter';

import type { MovieType } from 'apps/api/src/app/movies/movie.type';

const { Title } = Typography;
const { useBreakpoint } = Grid;

export type MoviePageProps = {
    breadcrumbs: { label: string | ReactNode; url?: string }[];
};

export default function MoviePage({ breadcrumbs }: MoviePageProps) {
    const { md } = useBreakpoint();
    const search = useSearchParams();

    const [query, setQuery] = useState<
        | undefined
        | {
              pagination: {
                  current: number | undefined;
                  pageSize: number | undefined;
              };
              filters?: CrudFilter[] | undefined;
              sorters?: CrudSort[] | undefined;
              current?: number | undefined;
              pageSize?: number | undefined;
          }
    >(undefined);

    useEffect(() => {
        setQuery(parseTableParams(search?.toString()));
    }, [search]);

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
        meta: {
            gqlQuery: MOVIES_LIST_QUERY,
        },
        filters: {
            mode: 'server',
            defaultBehavior: 'replace',
            initial: query?.filters && query?.filters?.length > 0 ? query?.filters : [],
        },
        pagination: {
            mode: 'server',
            current: query?.current || 1,
            pageSize: Math.min(query?.pageSize || 24, 24),
        },
        sorters: {
            mode: 'server',
            initial:
                query?.sorters && query?.sorters?.length > 0
                    ? query?.sorters
                    : [{ field: 'view', order: 'desc' }],
        },
    });

    useEffect(() => {
        setQuery({
            pagination: {
                current: current,
                pageSize: pageSize,
            },
            filters: filters,
            sorters: sorters,
        });
    }, [filters, sorters, current, pageSize]);

    const handleVisibleContentCard = (index: number | null) => {
        setSelectedIndex(index === selectedIndex ? null : index);
    };

    const handleFilterChange = (key: string, value: unknown) => {
        let newFilters = query?.filters?.filter((x) => (x as LogicalFilter)?.field !== key);

        if (value !== undefined && value !== null) {
            newFilters = [
                ...(newFilters || []),
                {
                    field: key,
                    value: Array.isArray(value) ? value.join(',') : value,
                    operator: Array.isArray(value) ? 'in' : 'eq',
                },
            ];
        }
        setQuery((prev) => ({ ...prev, filters: newFilters }));
    };

    const handleSorterChange = (value: string) => {
        const [val, ord] = value?.split(',') || [];
        if (value !== null || value !== undefined) {
            setQuery((prev) => ({
                ...prev,
                sorters: [{ field: val, order: ord === 'asc' ? 'asc' : 'desc' }],
            }));
        }
    };

    const applyFilters = () => {
        setFilters(query?.filters || []);
        setSorters(query?.sorters ? [query?.sorters?.[0]] : []);
        setCurrent(1);
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
                    localFilters={query?.filters}
                    localSorter={query?.sorters?.[0]}
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
