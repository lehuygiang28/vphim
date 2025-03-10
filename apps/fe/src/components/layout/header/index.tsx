'use client';

import './header.css';

import React, { useState, ReactNode, useEffect, useRef } from 'react';
import { Layout, Menu, Button, Drawer, Grid, Badge } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import Link from 'next/link';
import Image from 'next/image';
import { ItemType, MenuItemType } from 'antd/lib/menu/interface';
import { usePathname } from 'next/navigation';

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
        label: (
            <Link className="netflix-link" href={'/'}>
                Trang Chủ
            </Link>
        ),
    },
    {
        key: MovieTypeEnum.SERIES,
        label: (
            <Link
                className="netflix-link"
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
                className="netflix-link"
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
                className="netflix-link"
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
                className="netflix-link"
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
    const [isScrolled, setIsScrolled] = useState(false);
    const [prevScrollPos, setPrevScrollPos] = useState(0);
    const [hideHeader, setHideHeader] = useState(false);
    const [hovering, setHovering] = useState(false);
    const screens = useBreakpoint();
    const headerRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    // Add enhanced scroll listener with hide/show behavior
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollPos = window.scrollY;
            const scrollingUp = prevScrollPos > currentScrollPos;
            const scrollThreshold = 50;

            // Don't hide header when hovering over it
            if (!hovering) {
                // Only hide header when scrolling down and past the threshold
                setHideHeader(!scrollingUp && currentScrollPos > 200);
            }
            setIsScrolled(currentScrollPos > scrollThreshold);
            setPrevScrollPos(currentScrollPos);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [prevScrollPos, hovering]);

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
            ref={headerRef}
            className={`netflix-header ${isScrolled ? 'scrolled' : 'transparent'} ${
                hideHeader ? 'header-hidden' : ''
            }`}
            style={{
                transform: hideHeader ? 'translateY(-100%)' : 'translateY(0)',
            }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            <Link
                href="/"
                className="logo-container header-animated"
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
                    width={128}
                    height={30}
                    priority
                />
            </Link>
            {screens.md && (
                <Menu
                    className="netflix-menu header-animated"
                    mode="horizontal"
                    items={navItems}
                    style={{
                        flex: 1,
                        minWidth: 0,
                        justifyContent: 'flex-start',
                    }}
                />
            )}
            <div
                className="header-animated"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative',
                    animationDelay: '0.1s',
                }}
            >
                <HeaderSearch />
                {!screens.md && (
                    <Badge dot={drawerVisible} color="var(--vphim-colorPrimary)">
                        <Button
                            type="text"
                            className="netflix-mobile-menu-btn"
                            icon={<MenuOutlined />}
                            onClick={showDrawer}
                            style={{ marginRight: '0.5rem' }}
                        />
                    </Badge>
                )}
                <HeaderUser />
            </div>
            <Drawer
                title="Menu"
                placement="right"
                onClose={onCloseDrawer}
                open={drawerVisible}
                className="netflix-drawer"
                styles={{
                    body: { padding: 0 },
                }}
                width={'70%'}
            >
                <div style={{ padding: '1rem' }}>
                    <HeaderSearch />
                    <Menu
                        className="netflix-menu"
                        mode="inline"
                        items={navItems}
                        style={{ height: '100%' }}
                        onClick={onCloseDrawer}
                    />
                </div>
            </Drawer>
        </Header>
    );
}
