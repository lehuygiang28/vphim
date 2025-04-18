'use client';

import React from 'react';
import { Breadcrumb, Divider, Grid } from 'antd';
import Link from 'next/link';
import { HomeOutlined } from '@ant-design/icons';

import { WatchHistoryList } from '@/components/pages/watch-history';

const { useBreakpoint } = Grid;

export default function WatchHistoryPage() {
    const { md } = useBreakpoint();

    return (
        <>
            <div
                className="layout-space-container"
                style={{
                    marginLeft: md ? '3rem' : '0.7rem',
                    marginRight: md ? '3rem' : '0.7rem',
                    paddingBottom: '2rem',
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                <Breadcrumb
                    style={{ marginBottom: '1rem' }}
                    items={[
                        {
                            title: (
                                <Link href={'/'}>
                                    <HomeOutlined style={{ marginRight: '0.5rem' }} />
                                    Trang chủ
                                </Link>
                            ),
                        },
                        {
                            title: <Link href={'/lich-su'}>Lịch sử xem phim</Link>,
                        },
                    ]}
                />
                <Divider />
                <WatchHistoryList />

                <Divider style={{ marginTop: '4rem' }} />
            </div>
        </>
    );
}
