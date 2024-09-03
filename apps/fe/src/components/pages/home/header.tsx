'use client';
import './header.css';

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Input, Button, Drawer, Grid } from 'antd';
import { SearchOutlined, UserOutlined, MenuOutlined } from '@ant-design/icons';
import Link from 'next/link';
import Image from 'next/image';

const { Header } = Layout;
const { useBreakpoint } = Grid;

const navItems = [
    {
        key: 'home',
        label: 'Home',
        url: '/',
    },
    {
        key: 'phim-bo',
        label: 'Phim Bộ',
        url: '/phim-bo',
    },
    {
        key: 'phim-le',
        label: 'Phim Lẻ',
        url: '/phim-le',
    },
    {
        key: 'phim-hay',
        label: 'Phim Hay',
        url: '/phim-hay',
    },
    {
        key: 'tv-shows',
        label: 'TV Shows',
        url: '/tv-shows',
    },
    {
        key: 'the-loai',
        label: 'Thể Loại',
        children: [
            {
                label: 'Phim Tình Cảm',
                key: 'the-loai/tinh-cam',
                url: 'the-loai/tinh-cam',
            },
            {
                label: 'Phim Hành Động',
                key: 'the-loai/hanh-dong',
                url: 'the-loai/hanh-dong',
            },
            {
                label: 'Phim Hoạt Hình',
                key: 'the-loai/hoat-hinh',
                url: 'the-loai/hoat-hinh',
            },
        ],
    },
    {
        label: 'Quốc Gia',
        key: 'quoc-gia',
        children: [
            {
                label: 'Việt Nam',
                key: 'quoc-gia/viet-nam',
                url: 'quoc-gia/viet-nam',
            },
            {
                label: 'Hàn Quốc',
                key: 'quoc-gia/han-quoc',
                url: 'quoc-gia/han-quoc',
            },
            {
                label: 'Trung Quốc',
                key: 'quoc-gia/trung-quoc',
                url: 'quoc-gia/trung-quoc',
            },
        ],
    },
];

export default function HeaderCom() {
    const [scrolled, setScrolled] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [searchVisible, setSearchVisible] = useState(false);
    const screens = useBreakpoint();

    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 10;
            if (isScrolled !== scrolled) {
                setScrolled(isScrolled);
            }
        };

        document.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            document.removeEventListener('scroll', handleScroll);
        };
    }, [scrolled]);

    const showDrawer = () => {
        setDrawerVisible(true);
    };

    const onCloseDrawer = () => {
        setDrawerVisible(false);
    };

    const toggleSearch = () => {
        setSearchVisible(!searchVisible);
    };

    return (
        <Header
            style={{
                position: 'fixed',
                top: 0,
                zIndex: 999,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: screens.md ? '0 50px' : '0 15px',
                background: scrolled ? undefined : 'transparent',
                transition: 'background-color 0.3s ease',
            }}
        >
            <Link href="/" style={{ display: 'flex', alignItems: 'center', marginRight: '24px' }}>
                <Image src="/placeholder.svg" alt="vphim Logo" width={100} height={40} />
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
            <div style={{ display: 'flex', alignItems: 'center' }}>
                {screens.md ? (
                    <Input
                        placeholder="Search..."
                        prefix={<SearchOutlined />}
                        style={{ width: 200, marginRight: '16px' }}
                    />
                ) : (
                    <>
                        <Button
                            type="text"
                            icon={<SearchOutlined />}
                            onClick={toggleSearch}
                            style={{ marginRight: '8px' }}
                        />
                        <Button
                            type="text"
                            icon={<MenuOutlined />}
                            onClick={showDrawer}
                            style={{ marginRight: '8px' }}
                        />
                    </>
                )}
                <Button type="default" icon={<UserOutlined />}>
                    {screens.md ? 'Login' : null}
                </Button>
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
                <div style={{ padding: '16px' }}>
                    <Input
                        placeholder="Search..."
                        prefix={<SearchOutlined />}
                        style={{ width: '100%', marginBottom: '16px' }}
                    />
                    <Menu
                        mode="inline"
                        items={navItems}
                        style={{ height: '100%', background: 'transparent' }}
                        onClick={onCloseDrawer}
                    />
                </div>
            </Drawer>
            {!screens.md && (
                <Drawer
                    title="Search"
                    placement="top"
                    onClose={toggleSearch}
                    open={searchVisible}
                    height="auto"
                >
                    <Input
                        placeholder="Search..."
                        prefix={<SearchOutlined />}
                        style={{ width: '100%' }}
                    />
                </Drawer>
            )}
        </Header>
    );
}
