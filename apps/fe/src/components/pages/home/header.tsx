import React, { useState, useEffect } from 'react';
import { Layout, Menu, Input, Button, Typography } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Title } = Typography;
const { Header } = Layout;

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
                key: 'phim-tinh-cam',
                label: 'Phim Tình Cảm',
                url: '/phim-tinh-cam',
            },
            {
                label: 'Phim Tinh Cảm 2',
                key: 'phim-tinh-cam-2',
                url: '/phim-tinh-cam-2',
            },
            {
                label: 'Phim Tinh Cảm 3',
                key: 'phim-tinh-cam-3',
                url: '/phim-tinh-cam-3',
            },
        ],
    },
    {
        label: 'Quốc Gia',
        key: 'quoc-gia',
        children: [
            {
                label: 'Việt Nam',
                key: 'viet-nam',
                url: '/viet-nam',
            },
            {
                label: 'Hàn Quốc',
                key: 'han-quoc',
                url: '/han-quoc',
            },
            {
                label: 'Trung Quốc',
                key: 'trung-quoc',
                url: '/trung-quoc',
            },
        ],
    },
];

export default function HeaderCom() {
    const [scrolled, setScrolled] = useState(false);

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

    return (
        <Header
            style={{
                position: 'fixed',
                top: 0,
                zIndex: 999,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '0 50px',
                background: scrolled ? undefined : 'transparent',
                transition: 'background-color 0.3s ease',
            }}
        >
            <Title
                level={3}
                style={{
                    margin: 0,
                    marginRight: '24px',
                    // color: scrolled ? 'rgba(0, 0, 0, 0.88)' : '#fff',
                }}
            >
                <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
                    vphim
                </Link>
            </Title>
            <Menu
                mode="horizontal"
                items={navItems}
                style={{
                    flex: 1,
                    minWidth: 0,
                    justifyContent: 'flex-start',
                    background: 'transparent',
                }}
                itemProp=""
                overflowedIndicator={
                    <Button
                        type="text"
                        icon={<UserOutlined />}
                        style={{ color: scrolled ? 'rgba(0, 0, 0, 0.88)' : '#fff' }}
                    />
                }
            />
            <Input
                placeholder="Search..."
                prefix={<SearchOutlined />}
                style={{ width: 200, marginRight: '16px' }}
            />
            <Button type="primary" icon={<UserOutlined />}>
                Login
            </Button>
        </Header>
    );
}
