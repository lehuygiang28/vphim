'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Breadcrumb, Tooltip } from 'antd';
import { HomeOutlined, SearchOutlined } from '@ant-design/icons';

type EpisodeBreadcrumbProps = {
    movie: {
        slug: string;
        name: string;
    };
    episodeSlug: string;
    episodeName: string;
};

export const EpisodeBreadcrumb: React.FC<EpisodeBreadcrumbProps> = ({
    movie,
    episodeSlug,
    episodeName,
}) => {
    const searchParams = useSearchParams();
    const referrerSearch = searchParams?.get('from') || '';

    // Check if there are search parameters to enhance the UX
    const hasSearchParams = referrerSearch.length > 0;

    return (
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
                    title: hasSearchParams ? (
                        <Tooltip title="Quay lại kết quả tìm kiếm">
                            <Link href={`/danh-sach-phim?${referrerSearch}`}>
                                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                                    Danh sách phim
                                    <SearchOutlined
                                        style={{ marginLeft: '0.3rem', fontSize: '0.8rem' }}
                                    />
                                </span>
                            </Link>
                        </Tooltip>
                    ) : (
                        <Link href="/danh-sach-phim">Danh sách phim</Link>
                    ),
                },
                {
                    title: (
                        <Link
                            href={`/phim/${movie.slug}${
                                referrerSearch ? `?from=${referrerSearch}` : ''
                            }`}
                        >
                            {movie.name}
                        </Link>
                    ),
                },
                {
                    title: <Link href={`/phim/${movie.slug}/${episodeSlug}`}>{episodeName}</Link>,
                },
            ]}
        />
    );
};
