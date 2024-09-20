'use client';

import './header.css';

import React, { useState, ReactNode, useEffect, useRef } from 'react';
import { Layout, Menu, Input, Button, Drawer, Grid, Dropdown, Avatar } from 'antd';
import { SearchOutlined, UserOutlined, MenuOutlined, DownOutlined } from '@ant-design/icons';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { stringifyTableParams, useGetIdentity } from '@refinedev/core';
import { ItemType, MenuItemType } from 'antd/lib/menu/interface';
import { signOut } from 'next-auth/react';

import { RouteNameEnum } from '@/constants/route.constant';

import { MovieTypeEnum } from 'apps/api/src/app/movies/movie.constant';
import { UserDto } from 'apps/api/src/app/users/dtos/user.dto';

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
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const screens = useBreakpoint();
    const [searchValue, setSearchValue] = useState('');
    const router = useRouter();
    const { data: user, isLoading } = useGetIdentity<UserDto>();
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setSearchFocused(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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

    const toggleSearch = () => {
        setSearchVisible(!searchVisible);
    };

    const handleSearchIconClick = () => {
        const searchQuery = stringifyTableParams({
            filters: [
                {
                    field: 'keywords',
                    operator: 'eq',
                    value: searchValue,
                },
            ],
            sorters: [],
        });

        router.push(`${RouteNameEnum.MOVIE_LIST_PAGE}?${searchQuery}`);

        if (!screens.md) {
            toggleSearch();
        }
    };

    const handleSearch = () => {
        handleSearchIconClick();
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
                {screens.md ? (
                    <div ref={searchRef} style={{ position: 'relative' }}>
                        <Input
                            placeholder="Tìm kiếm"
                            suffix={
                                <SearchOutlined
                                    onClick={handleSearchIconClick}
                                    style={{ cursor: 'pointer' }}
                                />
                            }
                            style={{
                                width: searchFocused ? '18.75rem' : '12.5rem',
                                marginRight: '1rem',
                                transition: 'all 0.3s ease',
                            }}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => !searchValue && setSearchFocused(false)}
                            onPressEnter={handleSearch}
                            allowClear
                            onClear={() => {
                                setSearchValue('');
                                setSearchFocused(false);
                            }}
                        />
                    </div>
                ) : (
                    <>
                        <Button
                            type="text"
                            icon={<SearchOutlined />}
                            onClick={toggleSearch}
                            style={{ marginRight: '0.5rem' }}
                        />
                        <Button
                            type="text"
                            icon={<MenuOutlined />}
                            onClick={showDrawer}
                            style={{ marginRight: '0.5rem' }}
                        />
                    </>
                )}
                {user && !isLoading ? (
                    <Dropdown
                        menu={{
                            items: [
                                {
                                    key: '1',
                                    label: (
                                        <Link href={'/nguoi-dung/cap-nhat-thong-tin'}>
                                            Thông tin tài khoản
                                        </Link>
                                    ),
                                },
                                {
                                    key: '2',
                                    label: <Link href={'/tu-phim'}>Tủ phim</Link>,
                                },
                                {
                                    key: '3',
                                    label: (
                                        <Link href={'#'} onClick={() => signOut()}>
                                            Đăng xuất
                                        </Link>
                                    ),
                                },
                            ],
                        }}
                        trigger={['click']}
                    >
                        <Button
                            type="text"
                            href={'#'}
                            onClick={(e) => e.preventDefault()}
                            style={{ display: 'flex', alignItems: 'center' }}
                        >
                            <Avatar
                                src={user.avatar?.url}
                                icon={<UserOutlined />}
                                style={{ marginRight: '0.3rem' }}
                            />
                            {screens?.md && (
                                <span style={{ marginRight: '0.3rem' }}>{user.fullName}</span>
                            )}
                            <DownOutlined />
                        </Button>
                    </Dropdown>
                ) : (
                    <Link href={RouteNameEnum.LOGIN_PAGE}>
                        <Button type="default" icon={<UserOutlined />}></Button>
                    </Link>
                )}
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
                    <Input
                        placeholder="Tìm kiếm"
                        suffix={
                            <SearchOutlined
                                onClick={handleSearchIconClick}
                                style={{ cursor: 'pointer' }}
                            />
                        }
                        style={{ width: '100%', marginBottom: '1rem' }}
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onPressEnter={handleSearch}
                        allowClear
                        onClear={() => setSearchValue('')}
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
                        placeholder="Tìm kiếm"
                        suffix={
                            <SearchOutlined
                                onClick={handleSearchIconClick}
                                style={{ cursor: 'pointer' }}
                            />
                        }
                        style={{ width: '100%' }}
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onPressEnter={handleSearch}
                        allowClear
                        onClear={() => setSearchValue('')}
                    />
                </Drawer>
            )}
        </Header>
    );
}
