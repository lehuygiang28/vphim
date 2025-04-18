'use client';

import React, { useState, useMemo } from 'react';
import {
    List,
    Card,
    Typography,
    Button,
    Empty,
    Spin,
    Row,
    Col,
    Tooltip,
    Progress,
    Popconfirm,
} from 'antd';
import { DeleteOutlined, PlayCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { vi as viVN } from 'date-fns/locale';

import { WatchHistoryType } from 'apps/api/src/app/watch-history/watch-history.type';

import useWatchHistory from '@/hooks/useWatchHistory';
import { getOptimizedImageUrl } from '@/libs/utils/movie.util';
import { RouteNameEnum } from '@/constants/route.constant';

const { Text } = Typography;

const PER_PAGE = 12;

function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds
            .toString()
            .padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function WatchHistoryList() {
    const router = useRouter();
    const { watchHistory, isLoading, isAuthenticated, deleteWatchHistory, clearAllWatchHistory } =
        useWatchHistory();
    const [currentPage, setCurrentPage] = useState(1);

    const paginatedHistory = useMemo(() => {
        const startIndex = (currentPage - 1) * PER_PAGE;
        return watchHistory.slice(startIndex, startIndex + PER_PAGE);
    }, [watchHistory, currentPage]);

    const handleContinueWatching = (history: WatchHistoryType) => {
        const url = `${RouteNameEnum.MOVIE_PAGE}/${history.movieId.slug}/${history.episodeSlug}${
            history?.serverIndex > 0 ? `?server=${history.serverIndex}` : ''
        }`;
        router.push(url);
    };

    const handleDelete = async (id: string) => {
        await deleteWatchHistory(id);
    };

    const handleClearAll = async () => {
        await clearAllWatchHistory();
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    if (!isAuthenticated) {
        return (
            <Empty
                description="Đăng nhập để xem lịch sử xem phim"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
        );
    }

    if (isLoading) {
        return <Spin size="large" style={{ display: 'block', margin: '20px auto' }} />;
    }

    if (watchHistory.length === 0) {
        return (
            <Empty description="Chưa có lịch sử xem phim" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        );
    }

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    marginBottom: 16,
                }}
            >
                <Popconfirm
                    title="Xóa lịch sử xem phim"
                    description="Bạn có chắc chắn muốn xóa tất cả lịch sử xem phim?"
                    onConfirm={handleClearAll}
                    okText="Xóa"
                    cancelText="Hủy"
                >
                    <Button danger icon={<DeleteOutlined />}>
                        Xóa tất cả
                    </Button>
                </Popconfirm>
            </div>

            <List
                grid={{
                    gutter: [16, 36],
                    xs: 1,
                    sm: 2,
                    md: 3,
                    lg: 4,
                    xl: 5,
                    xxl: 6,
                }}
                dataSource={paginatedHistory}
                loading={isLoading}
                locale={{
                    emptyText: (
                        <Empty
                            description="Chưa có lịch sử xem phim"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    ),
                }}
                renderItem={(item) => {
                    const progress =
                        item.progress.duration > 0
                            ? Math.round((item.progress.currentTime / item.progress.duration) * 100)
                            : 0;

                    return (
                        <List.Item>
                            <Card
                                hoverable
                                cover={
                                    <div
                                        style={{
                                            position: 'relative',
                                            overflow: 'hidden',
                                            paddingTop: '56.25%',
                                        }}
                                    >
                                        <Link
                                            href={`${RouteNameEnum.MOVIE_PAGE}/${item.movieId.slug}`}
                                        >
                                            <img
                                                alt={item.movieId.name}
                                                src={getOptimizedImageUrl(item.movieId.thumbUrl, {
                                                    width: 400,
                                                    height: 225,
                                                    quality: 70,
                                                })}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                        </Link>
                                        <div
                                            style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                padding: '4px 8px',
                                                background:
                                                    'linear-gradient(transparent, rgba(0,0,0,0.8))',
                                            }}
                                        >
                                            <Text strong style={{ color: 'white' }}>
                                                {item.episodeName || 'Tập 1'}
                                            </Text>
                                        </div>
                                        <div
                                            style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                height: '4px',
                                            }}
                                        >
                                            <Progress
                                                percent={progress}
                                                size="small"
                                                showInfo={false}
                                                status={
                                                    item.progress.completed ? 'success' : 'active'
                                                }
                                                strokeColor="#1890ff"
                                                trailColor="rgba(255,255,255,0.3)"
                                            />
                                        </div>
                                    </div>
                                }
                                actions={[
                                    <Tooltip title="Tiếp tục xem" key="continue">
                                        <Button
                                            type="default"
                                            icon={<PlayCircleOutlined />}
                                            onClick={() => handleContinueWatching(item)}
                                        >
                                            Tiếp tục
                                        </Button>
                                    </Tooltip>,
                                    <Tooltip title="Xóa khỏi lịch sử" key="delete">
                                        <Popconfirm
                                            title="Xóa khỏi lịch sử"
                                            description="Bạn có chắc chắn muốn xóa phim này khỏi lịch sử?"
                                            onConfirm={() => handleDelete(item._id.toString())}
                                            okText="Xóa"
                                            cancelText="Hủy"
                                        >
                                            <Button type="text" danger icon={<DeleteOutlined />}>
                                                Xóa
                                            </Button>
                                        </Popconfirm>
                                    </Tooltip>,
                                ]}
                            >
                                <Card.Meta
                                    title={
                                        <Tooltip title={item.movieId.name}>
                                            <Link
                                                href={`${RouteNameEnum.MOVIE_PAGE}/${item.movieId.slug}`}
                                            >
                                                <Text ellipsis style={{ width: '100%' }}>
                                                    {item.movieId.name}
                                                </Text>
                                            </Link>
                                        </Tooltip>
                                    }
                                    description={
                                        <div>
                                            <Row align="middle" gutter={[8, 8]}>
                                                <Col>
                                                    <ClockCircleOutlined />
                                                </Col>
                                                <Col>
                                                    <Tooltip
                                                        title={new Date(
                                                            item.lastWatched,
                                                        ).toLocaleString()}
                                                    >
                                                        {formatDistanceToNow(
                                                            new Date(item.lastWatched),
                                                            {
                                                                addSuffix: true,
                                                                locale: viVN,
                                                            },
                                                        )}
                                                    </Tooltip>
                                                </Col>
                                            </Row>
                                            <Row style={{ marginTop: 8 }}>
                                                <Col span={24}>
                                                    <Text type="secondary">
                                                        {formatDuration(item.progress.currentTime)}{' '}
                                                        / {formatDuration(item.progress.duration)}
                                                    </Text>
                                                </Col>
                                            </Row>
                                            <Row style={{ marginTop: 8 }}>
                                                <Col span={24}>
                                                    <Tooltip title={`Máy chủ ${item.serverName}`}>
                                                        <Text type="secondary">
                                                            {item.serverName}
                                                        </Text>
                                                    </Tooltip>
                                                </Col>
                                            </Row>
                                        </div>
                                    }
                                />
                            </Card>
                        </List.Item>
                    );
                }}
                pagination={
                    watchHistory.length <= PER_PAGE
                        ? false
                        : {
                              style: { marginTop: '2rem' },
                              current: currentPage,
                              pageSize: PER_PAGE,
                              total: watchHistory.length,
                              showSizeChanger: false,
                              onChange: (page) => handlePageChange(page),
                          }
                }
            />
        </div>
    );
}

export default WatchHistoryList;
