'use client';

import './header.css';

import React, { useState, ReactNode } from 'react';
import { Layout, Menu, Button, Drawer, Grid } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import Link from 'next/link';
import Image from 'next/image';
import { ItemType, MenuItemType } from 'antd/lib/menu/interface';

import { MovieTypeEnum } from 'apps/api/src/app/movies/movie.constant';

import { RouteNameEnum } from '@/constants/route.constant';
import { stringifyTableParams } from '@/libs/utils/url.util';
import HeaderSearch from './header-search';
import HeaderUser from './header-user';

const { Header } = Layout;
const { useBreakpoint } = Grid;

const baseNavItems: ItemType<MenuItemType>[] = [
    {
        key: 'home',
        label: <Link href={'/'}>Trang Chủ</Link>,
    },
    {
        key: MovieTypeEnum.SERIES,
        label: (
            <Link
                href={`${RouteNameEnum.MOVIE_LIST_PAGE}?${stringifyTableParams({
                    filters: [
                        {
                            field: 'type',
                            operator: 'eq',
                            value: MovieTypeEnum.SERIES,
                        },
                    ],
                    sorters: [
                        {
                            field: 'updatedAt',
                            order: 'desc',
                        },
                    ],
                })}`}
            >
                Phim Bộ
            </Link>
        ),
    },
    {
        key: MovieTypeEnum.SINGLE,
        label: (
            <Link
                href={`${RouteNameEnum.MOVIE_LIST_PAGE}?${stringifyTableParams({
                    filters: [
                        {
                            field: 'type',
                            operator: 'eq',
                            value: MovieTypeEnum.SINGLE,
                        },
                    ],
                    sorters: [
                        {
                            field: 'updatedAt',
                            order: 'desc',
                        },
                    ],
                })}`}
            >
                Phim Lẻ
            </Link>
        ),
    },
    {
        key: 'phim-hay',
        label: (
            <Link
                href={`${RouteNameEnum.MOVIE_LIST_PAGE}?${stringifyTableParams({
                    filters: [],
                    sorters: [
                        {
                            field: 'view',
                            order: 'desc',
                        },
                    ],
                })}`}
            >
                Phim Hay
            </Link>
        ),
    },
    {
        key: MovieTypeEnum.TV_SHOWS,
        label: (
            <Link
                href={`${RouteNameEnum.MOVIE_LIST_PAGE}?${stringifyTableParams({
                    filters: [
                        {
                            field: 'type',
                            operator: 'eq',
                            value: MovieTypeEnum.TV_SHOWS,
                        },
                    ],
                    sorters: [
                        {
                            field: 'updatedAt',
                            order: 'desc',
                        },
                    ],
                })}`}
            >
                TV Shows
            </Link>
        ),
    },
];

export type HeaderProps = {
    categoryMenu?: { label: ReactNode; key: string }[];
    regionMenu?: { label: ReactNode; key: string }[];
};

export default function HeaderCom({ categoryMenu = [], regionMenu = [] }: HeaderProps) {
    const [drawerVisible, setDrawerVisible] = useState(false);
    const screens = useBreakpoint();

    const navItems = [
        ...baseNavItems,
        {
            key: 'the-loai',
            label: 'Thể Loại',
            children: categoryMenu,
        },
        {
            label: 'Quốc Gia',
            key: 'quoc-gia',
            children: regionMenu,
        },
    ];

    const showDrawer = () => {
        setDrawerVisible(true);
    };

    const onCloseDrawer = () => {
        setDrawerVisible(false);
    };

    return (
        <Header
            style={{
                position: 'absolute',
                top: 0,
                zIndex: 999,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: screens.md ? '0 3.125rem' : '0 0.9375rem',
                background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.0))',
                transition: 'background-color 0.3s ease',
            }}
        >
            <Link
                href="/"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginRight: '1rem',
                    height: '100%',
                }}
            >
                <Image
                    src="/assets/images/logo-mini.png"
                    alt="vphim Logo"
                    width={100}
                    height={30}
                    priority
                />
            </Link>
            {screens.md && (
                <Menu
                    mode="horizontal"
                    items={navItems}
                    style={{
                        flex: 1,
                        minWidth: 0,
                        justifyContent: 'flex-start',
                        background: 'transparent',
                    }}
                />
            )}
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <HeaderSearch />
                {!screens.md && (
                    <Button
                        type="text"
                        icon={<MenuOutlined />}
                        onClick={showDrawer}
                        style={{ marginRight: '0.5rem' }}
                    />
                )}
                <HeaderUser />
            </div>
            <Drawer
                title="Menu"
                placement="right"
                onClose={onCloseDrawer}
                open={drawerVisible}
                styles={{
                    body: { padding: 0 },
                }}
                width={'60%'}
            >
                <div style={{ padding: '1rem' }}>
                    <HeaderSearch />
                    <Menu
                        mode="inline"
                        items={navItems}
                        style={{ height: '100%', background: 'transparent' }}
                        onClick={onCloseDrawer}
                    />
                </div>
            </Drawer>
        </Header>
    );
}
