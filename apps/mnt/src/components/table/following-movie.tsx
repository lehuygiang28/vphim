'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import {
    Table,
    Space,
    Input,
    Image as AntImage,
    Button,
    Typography,
    Row,
    Col,
    Card,
    Tooltip,
} from 'antd';
import { SearchOutlined, EyeOutlined, SettingOutlined } from '@ant-design/icons';
import { createRegex } from '@vn-utils/text';

import { MovieTypeEnum, MovieStatusEnum } from '~api/app/movies/movie.constant';
import type { MovieType } from '~api/app/movies/movie.type';
import { getOptimizedImageUrl } from '~fe/libs/utils/movie.util';
import { formatDateToHumanReadable } from '@/libs/utils/common';
import MovieStatusTag, { movieStatusOptions } from '../tag/movie-status-tag';
import MovieTypeTag, { movieTypeOptions } from '../tag/movie-type-tag';
import { resolveUrl } from '~api/libs/utils/common';
import { RouteNameEnum } from '@/constants/route.constant';

const { Text } = Typography;

export type FollowingMovieTableProps = {
    movies: MovieType[];
    loading?: boolean;
};

export function FollowingMovieTable({ movies = [], loading = false }: FollowingMovieTableProps) {
    const router = useRouter();
    const [searchKeyword, setSearchKeyword] = useState('');
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
    });

    // Handle search input change with debounce
    const debouncedSearch = useDebouncedCallback((value: string) => {
        setSearchKeyword(value);
        setPagination({ ...pagination, current: 1 });
    }, 300);

    // Filter movies based on search keyword
    const filteredMoviesBySearch = useMemo(() => {
        if (!searchKeyword) return movies;

        const regex = createRegex(searchKeyword);
        return movies.filter(
            (movie) =>
                regex.test(movie.name.toLowerCase()) ||
                regex.test((movie.originName || '').toLowerCase()) ||
                regex.test((movie.directors || []).join(' ').toLowerCase()) ||
                regex.test((movie.actors || []).join(' ').toLowerCase()) ||
                regex.test((movie.content || '').toLowerCase()),
        );
    }, [movies, searchKeyword]);

    return (
        <>
            <Card style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24}>
                        <Input.Search
                            placeholder="Tìm kiếm phim theo tên, diễn viên, đạo diễn hoặc nội dung"
                            allowClear
                            onChange={(e) => debouncedSearch(e.target.value)}
                            enterButton={
                                <Button icon={<SearchOutlined />} type="primary">
                                    Tìm kiếm
                                </Button>
                            }
                        />
                    </Col>
                </Row>
            </Card>

            <Table<MovieType>
                rowKey="_id"
                dataSource={filteredMoviesBySearch}
                loading={loading}
                pagination={{
                    ...pagination,
                    total: filteredMoviesBySearch.length,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50'],
                    showTotal: (total, range) =>
                        `Hiển thị ${range[0]}-${range[1]} trên tổng ${total} kết quả`,
                    onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
                }}
                size="small"
                columns={[
                    {
                        title: 'STT',
                        key: 'index',
                        width: 60,
                        render: (_, __, index) => {
                            return (pagination.current - 1) * pagination.pageSize + index + 1;
                        },
                    },
                    {
                        title: 'Poster',
                        dataIndex: 'posterUrl',
                        key: 'posterUrl',
                        width: 80,
                        render: (posterUrl: string, record: MovieType) => (
                            <Tooltip title={record.name}>
                                <AntImage
                                    src={getOptimizedImageUrl(posterUrl, {
                                        width: 480,
                                        height: 854,
                                        quality: 60,
                                    })}
                                    alt={record.name}
                                    width={40}
                                    height={60}
                                    preview={false}
                                    style={{ cursor: 'pointer' }}
                                />
                            </Tooltip>
                        ),
                    },
                    {
                        title: 'Tên phim',
                        dataIndex: 'name',
                        key: 'name',
                        sorter: (a, b) => a.name.localeCompare(b.name),
                        render: (name: string, record: MovieType) => (
                            <Space direction="vertical" size={0}>
                                <Text strong>{name}</Text>
                                {record.originName && (
                                    <Text type="secondary">{record.originName}</Text>
                                )}
                            </Space>
                        ),
                    },
                    {
                        title: 'Định dạng',
                        dataIndex: 'type',
                        key: 'type',
                        width: 100,
                        sorter: (a, b) => a.type.localeCompare(b.type),
                        filters: movieTypeOptions.map((option) => ({
                            text: option.label,
                            value: option.value,
                        })),
                        onFilter: (value, record) => record.type === value,
                        render: (type: MovieTypeEnum) => <MovieTypeTag type={type} />,
                    },
                    {
                        title: 'Trạng thái',
                        dataIndex: 'status',
                        key: 'status',
                        width: 120,
                        sorter: (a, b) => a.status.localeCompare(b.status),
                        filters: movieStatusOptions.map((option) => ({
                            text: option.label,
                            value: option.value,
                        })),
                        onFilter: (value, record) => record.status === value,
                        render: (status: MovieStatusEnum) => <MovieStatusTag status={status} />,
                    },
                    {
                        title: 'Năm',
                        dataIndex: 'year',
                        key: 'year',
                        width: 80,
                        sorter: (a, b) => (a.year || 0) - (b.year || 0),
                        filters: Array.from(
                            new Set(
                                movies
                                    .map((movie) => movie.year)
                                    .filter(Boolean)
                                    .sort((a, b) => b - a),
                            ),
                        ).map((year) => ({
                            text: year,
                            value: year,
                        })),
                        onFilter: (value, record) => record.year === value,
                    },
                    {
                        title: 'Cập nhật lần cuối',
                        dataIndex: 'updatedAt',
                        key: 'updatedAt',
                        width: 150,
                        sorter: (a, b) => {
                            const aTime =
                                a.updatedAt instanceof Date
                                    ? (a.updatedAt as Date).getTime()
                                    : new Date(a.updatedAt as string).getTime();
                            const bTime =
                                b.updatedAt instanceof Date
                                    ? (b.updatedAt as Date).getTime()
                                    : new Date(b.updatedAt as string).getTime();
                            return aTime - bTime;
                        },
                        render: (date: string) => formatDateToHumanReadable(date),
                    },
                    {
                        title: 'Thao tác',
                        key: 'actions',
                        fixed: 'right',
                        width: 120,
                        render: (_, record) => {
                            const frontendUrl = resolveUrl(
                                `/${RouteNameEnum.MOVIE_PAGE}/${record.slug}`,
                                process.env.NEXT_PUBLIC_FRONT_END_URL,
                            );

                            return (
                                <Space>
                                    <Tooltip title="Xem phim">
                                        <Button
                                            icon={<EyeOutlined />}
                                            onClick={() => window.open(frontendUrl, '_blank')}
                                            size="small"
                                        />
                                    </Tooltip>
                                    <Tooltip title="Quản lý phim">
                                        <Button
                                            icon={<SettingOutlined />}
                                            onClick={() =>
                                                router.push(
                                                    `/movies/show/${record._id?.toString()}`,
                                                )
                                            }
                                            size="small"
                                        />
                                    </Tooltip>
                                </Space>
                            );
                        },
                    },
                ]}
            />
        </>
    );
}

export default FollowingMovieTable;
