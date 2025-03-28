'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Drawer, Grid } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { stringifyTableParams } from '@/libs/utils/url.util';
import { RouteNameEnum } from '@/constants/route.constant';

const { useBreakpoint } = Grid;

export default function HeaderSearch() {
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const router = useRouter();
    const screens = useBreakpoint();
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
        <>
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
                        style={{ marginRight: '0.3rem', padding: '4px 8px' }}
                    />
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
                </>
            )}
        </>
    );
}
