'use client';

import { PropsWithChildren } from 'react';
import { Layout, Grid } from 'antd';
import Link from 'next/link';
import dynamic from 'next/dynamic';

import type { CategoryType } from 'apps/api/src/app/categories/category.type';
import type { RegionType } from 'apps/api/src/app/regions/region.type';

import Header from './header';
const Footer = dynamic(() => import('./footer'), { ssr: true });
import { RouteNameEnum } from '@/constants/route.constant';
import { stringifyTableParams } from '@/libs/utils/url.util';

const { Content } = Layout;
const { useBreakpoint } = Grid;

export type LayoutComponentProps = PropsWithChildren & {
    categories?: CategoryType[];
    regions?: RegionType[];
};

export function LayoutComponent({ children, categories, regions }: LayoutComponentProps) {
    const { md } = useBreakpoint();

    return (
        <Layout
            style={{
                overflowX: 'hidden',
            }}
        >
            <Header
                categoryMenu={categories?.map((c) => ({
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
                regionMenu={regions?.map((r) => ({
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
                <Footer categories={categories} regions={regions} />
            </div>
        </Layout>
    );
}
