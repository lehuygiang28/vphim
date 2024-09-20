'use client';

import { PropsWithChildren } from 'react';
import { Layout, Grid, FloatButton } from 'antd';
import Link from 'next/link';
import { stringifyTableParams, useList } from '@refinedev/core';
import { CATEGORIES_LIST_QUERY } from '@/queries/categories';
import { REGIONS_LIST_QUERY } from '@/queries/regions';

import Header from './header';
import Footer from './footer';

import type { Category } from 'apps/api/src/app/categories/category.schema';
import type { Region } from 'apps/api/src/app/regions/region.schema';
import { RouteNameEnum } from '@/constants/route.constant';

const { Content } = Layout;
const { BackTop } = FloatButton;
const { useBreakpoint } = Grid;

export function LayoutComponent({ children }: PropsWithChildren) {
    const { md } = useBreakpoint();
    const { data: categories } = useList<Category>({
        dataProviderName: 'graphql',
        resource: 'categories',
        meta: {
            gqlQuery: CATEGORIES_LIST_QUERY,
            operation: 'categories',
        },
        pagination: {
            current: 1,
            pageSize: 12,
        },
    });

    const { data: regions } = useList<Region>({
        dataProviderName: 'graphql',
        resource: 'regions',
        meta: {
            gqlQuery: REGIONS_LIST_QUERY,
            operation: 'regions',
        },
        pagination: {
            current: 1,
            pageSize: 12,
        },
    });

    return (
        <Layout
            style={{
                overflowX: 'hidden',
            }}
        >
            <BackTop />
            <Header
                categoryMenu={categories?.data?.map((c) => ({
                    key: c.slug,
                    label: (
                        <Link
                            href={`${RouteNameEnum.MOVIE_LIST_PAGE}?${stringifyTableParams({
                                filters: [{ field: 'categories', value: c.slug, operator: 'in' }],
                                sorters: [],
                            })}`}
                        >
                            {c.name}
                        </Link>
                    ),
                }))}
                regionMenu={regions?.data?.map((r) => ({
                    key: r.slug,
                    label: (
                        <Link
                            href={`${RouteNameEnum.MOVIE_LIST_PAGE}?${stringifyTableParams({
                                filters: [{ field: 'countries', value: r.slug, operator: 'in' }],
                                sorters: [],
                            })}`}
                        >
                            {r.name}
                        </Link>
                    ),
                }))}
            />
            <Content
                style={{
                    minHeight: '110vh',
                    position: 'relative',
                }}
            >
                {children}
            </Content>

            <div style={{ marginTop: md ? '3rem' : '1.5rem' }}>
                <Footer categories={categories?.data} regions={regions?.data} />
            </div>
        </Layout>
    );
}
