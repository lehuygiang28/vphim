import React, { useState } from 'react';
import { useOne, useInvalidate } from '@refinedev/core';
import {
    Card,
    Row,
    Col,
    Statistic,
    Typography,
    Badge,
    Table,
    Timeline,
    Empty,
    Spin,
    Button,
    message,
    Skeleton,
    Tooltip,
} from 'antd';
import {
    RiseOutlined,
    EyeOutlined,
    CommentOutlined,
    FileAddOutlined,
    EditOutlined,
    FileDoneOutlined,
    ReloadOutlined,
    LoadingOutlined,
} from '@ant-design/icons';
import type {
    DashboardData,
    TopViewedMovie,
    TrendingMovie,
    RecentActivity,
} from '~api/app/dashboard/dashboard.type';

const { Title, Text } = Typography;

// Vietnamese translations
const viTranslations = {
    dashboardTitle: 'Tổng Quan',
    refreshButton: 'Làm Mới Dữ Liệu',
    refreshingButton: 'Đang Làm Mới...',
    loadingMessage: 'Đang tải dữ liệu bảng điều khiển...',
    refreshingMessage: 'Đang làm mới dữ liệu bảng điều khiển...',
    errorTitle: 'Lỗi',
    errorDescription: 'Đã xảy ra lỗi khi tải dữ liệu bảng điều khiển.',
    retryButton: 'Thử Lại',
    noDataDescription: 'Không có dữ liệu bảng điều khiển.',
    successMessage: 'Dữ liệu bảng điều khiển đã được làm mới thành công!',
    errorRefreshMessage: 'Không thể làm mới dữ liệu bảng điều khiển',
    totalMovies: 'Tổng Số Phim',
    moviesAddedToday: 'Phim Thêm Hôm Nay',
    moviesUpdatedToday: 'Phim Cập Nhật Hôm Nay',
    commentsToday: 'Bình Luận Hôm Nay',
    topViewedMovies: 'Phim Được Xem Nhiều Nhất',
    trendingToday: 'Phim Thịnh Hành Hôm Nay',
    moviesByType: 'Phim Theo Đinh dạng',
    recentActivities: 'Hoạt Động Gần Đây',
    movieColumn: 'Tên Phim',
    viewsColumn: 'Lượt Xem',
    viewsTodayColumn: 'Lượt Xem Hôm Nay',
    typeColumn: 'Đinh dạng',
    countColumn: 'Số Lượng',
    lastUpdatedColumn: 'Cập Nhật Lúc',
};

// Reusable RefreshableCard component with pulsing animation for loading
const RefreshableCard: React.FC<{
    title: string;
    loading?: boolean;
    extra?: React.ReactNode;
    children: React.ReactNode;
}> = ({ title, loading = false, extra, children }) => {
    return (
        <Card
            title={title}
            extra={extra}
            className={loading ? 'pulse-animation' : ''}
            style={
                loading
                    ? {
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      }
                    : { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
            }
        >
            {children}
            <style jsx global>{`
                @keyframes pulse {
                    0% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.8;
                    }
                    100% {
                        opacity: 1;
                    }
                }
                .pulse-animation::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.1);
                    animation: pulse 1.5s infinite ease-in-out;
                    pointer-events: none;
                }
                .pulse-animation {
                    animation: pulse-shadow 1.5s infinite ease-in-out;
                }
                @keyframes pulse-shadow {
                    0% {
                        box-shadow: 0 4px 12px rgba(24, 144, 255, 0.1);
                    }
                    50% {
                        box-shadow: 0 4px 20px rgba(24, 144, 255, 0.3);
                    }
                    100% {
                        box-shadow: 0 4px 12px rgba(24, 144, 255, 0.1);
                    }
                }
            `}</style>
        </Card>
    );
};

const MovieStatsDashboard: React.FC = () => {
    const invalidate = useInvalidate();
    const [refreshing, setRefreshing] = useState(false);
    const { data, isLoading, isError } = useOne<DashboardData>({
        id: '',
        resource: 'dashboard',
    });

    // Translate movie type function
    const translateMovieType = (type: string): string => {
        switch (type?.toLowerCase()) {
            case 'single':
                return 'Phim lẻ';
            case 'series':
                return 'Phim bộ';
            case 'hoathinh':
                return 'Hoạt hình';
            case 'tvshows':
                return 'TV Shows';
            default:
                return type;
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        message.loading({
            content: viTranslations.refreshingMessage,
            key: 'dashboardRefresh',
            duration: 0,
        });

        try {
            await invalidate({
                resource: 'dashboard',
                invalidates: ['all'],
            });
            message.success({
                content: viTranslations.successMessage,
                key: 'dashboardRefresh',
                duration: 2,
            });
        } catch (error) {
            message.error({
                content: viTranslations.errorRefreshMessage,
                key: 'dashboardRefresh',
                duration: 3,
            });
        } finally {
            setRefreshing(false);
        }
    };

    const isLoadingData = isLoading || refreshing;

    if (isLoading && !refreshing) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" tip={viTranslations.loadingMessage} />
            </div>
        );
    }

    if (isError && !refreshing) {
        return (
            <Card>
                <Empty description={viTranslations.errorDescription} />
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <Button
                        type="primary"
                        icon={refreshing ? <LoadingOutlined /> : <ReloadOutlined />}
                        onClick={handleRefresh}
                        loading={refreshing}
                        disabled={refreshing}
                    >
                        {viTranslations.retryButton}
                    </Button>
                </div>
            </Card>
        );
    }

    const dashboardData = data?.data;

    if (!dashboardData && !refreshing) {
        return (
            <Card>
                <Empty description={viTranslations.noDataDescription} />
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <Button
                        type="primary"
                        icon={refreshing ? <LoadingOutlined /> : <ReloadOutlined />}
                        onClick={handleRefresh}
                        loading={refreshing}
                        disabled={refreshing}
                    >
                        {viTranslations.refreshButton}
                    </Button>
                </div>
            </Card>
        );
    }

    // When refreshing but we have existing data, show the data with loading overlay
    if (refreshing && !dashboardData) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" tip={viTranslations.refreshingMessage} />
            </div>
        );
    }

    // Use existing data or empty fallback if refreshing
    const {
        overview = {
            totalMovies: 0,
            moviesAddedToday: 0,
            moviesUpdatedToday: 0,
            commentsToday: 0,
        },
        topViewedMovies = [],
        trendingToday = [],
        moviesByType = [],
        recentActivities = [],
    } = dashboardData || {};

    // Columns for the top viewed movies table
    const topViewedColumns = [
        {
            title: viTranslations.movieColumn,
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: TopViewedMovie) => (
                <a href={`/movies/show/${record._id}`} target="_blank" rel="noopener noreferrer">
                    {text}
                </a>
            ),
        },
        {
            title: viTranslations.viewsColumn,
            dataIndex: 'view',
            key: 'view',
            render: (views: number) => (
                <Tooltip title={views.toLocaleString('vi-VN')}>
                    <strong>{views?.toLocaleString('vi-VN') || 0}</strong>
                </Tooltip>
            ),
        },
    ];

    // Columns for the trending movies table
    const trendingColumns = [
        {
            title: viTranslations.movieColumn,
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: TrendingMovie) => (
                <a href={`/movies/show/${record._id}`} target="_blank" rel="noopener noreferrer">
                    {text}
                </a>
            ),
        },
        {
            title: viTranslations.viewsTodayColumn,
            dataIndex: 'viewsToday',
            key: 'viewsToday',
            render: (views: number) => (
                <Tooltip title={views.toLocaleString('vi-VN')}>
                    <strong>{views?.toLocaleString('vi-VN') || 0}</strong>
                </Tooltip>
            ),
        },
        {
            title: viTranslations.lastUpdatedColumn,
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            render: (date: Date) => new Date(date).toLocaleString('vi-VN'),
        },
    ];

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                }}
            >
                <Title level={3}>{viTranslations.dashboardTitle}</Title>
                <Button
                    type="primary"
                    icon={refreshing ? <LoadingOutlined /> : <ReloadOutlined />}
                    onClick={handleRefresh}
                    loading={refreshing}
                    disabled={refreshing}
                >
                    {refreshing ? viTranslations.refreshingButton : viTranslations.refreshButton}
                </Button>
            </div>

            {/* Stats Cards */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <RefreshableCard title={viTranslations.totalMovies} loading={isLoadingData}>
                        <Statistic
                            title=""
                            value={overview.totalMovies}
                            prefix={<FileDoneOutlined />}
                            loading={isLoadingData}
                            formatter={(value) => `${value.toLocaleString('vi-VN')}`}
                        />
                    </RefreshableCard>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <RefreshableCard
                        title={viTranslations.moviesAddedToday}
                        loading={isLoadingData}
                    >
                        <Statistic
                            title=""
                            value={overview.moviesAddedToday}
                            valueStyle={{ color: '#3f8600' }}
                            prefix={<FileAddOutlined />}
                            loading={isLoadingData}
                            formatter={(value) => `${value.toLocaleString('vi-VN')}`}
                        />
                    </RefreshableCard>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <RefreshableCard
                        title={viTranslations.moviesUpdatedToday}
                        loading={isLoadingData}
                    >
                        <Statistic
                            title=""
                            value={overview.moviesUpdatedToday}
                            valueStyle={{ color: '#1890ff' }}
                            prefix={<EditOutlined />}
                            loading={isLoadingData}
                            formatter={(value) => `${value.toLocaleString('vi-VN')}`}
                        />
                    </RefreshableCard>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <RefreshableCard title={viTranslations.commentsToday} loading={isLoadingData}>
                        <Statistic
                            title=""
                            value={overview.commentsToday}
                            prefix={<CommentOutlined />}
                            loading={isLoadingData}
                            formatter={(value) => `${value.toLocaleString('vi-VN')}`}
                        />
                    </RefreshableCard>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                {/* Top Viewed Movies */}
                <Col xs={24} lg={12}>
                    <RefreshableCard
                        title={viTranslations.topViewedMovies}
                        extra={<EyeOutlined />}
                        loading={isLoadingData}
                    >
                        <Table
                            dataSource={topViewedMovies}
                            columns={topViewedColumns}
                            rowKey="_id"
                            pagination={false}
                            size="small"
                            loading={isLoadingData}
                            locale={{
                                emptyText: isLoadingData ? (
                                    <Skeleton active paragraph={{ rows: 3 }} />
                                ) : (
                                    <Empty description="Không có dữ liệu" />
                                ),
                            }}
                        />
                    </RefreshableCard>
                </Col>

                {/* Trending Today */}
                <Col xs={24} lg={12}>
                    <RefreshableCard
                        title={viTranslations.trendingToday}
                        extra={<RiseOutlined />}
                        loading={isLoadingData}
                    >
                        <Table
                            dataSource={trendingToday}
                            columns={trendingColumns}
                            rowKey="_id"
                            pagination={false}
                            size="small"
                            loading={isLoadingData}
                            locale={{
                                emptyText: isLoadingData ? (
                                    <Skeleton active paragraph={{ rows: 3 }} />
                                ) : (
                                    <Empty description="Không có dữ liệu" />
                                ),
                            }}
                        />
                    </RefreshableCard>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                {/* Movies by Type */}
                <Col xs={24} lg={12}>
                    <RefreshableCard
                        title={viTranslations.moviesByType}
                        extra={<FileDoneOutlined />}
                        loading={isLoadingData}
                    >
                        <Table
                            dataSource={moviesByType}
                            columns={[
                                {
                                    title: viTranslations.typeColumn,
                                    dataIndex: 'type',
                                    key: 'type',
                                    render: (type: string) => translateMovieType(type),
                                },
                                {
                                    title: viTranslations.countColumn,
                                    dataIndex: 'count',
                                    key: 'count',
                                    render: (count: number) => (
                                        <strong>{count.toLocaleString('vi-VN')}</strong>
                                    ),
                                },
                            ]}
                            rowKey="type"
                            pagination={false}
                            size="small"
                            loading={isLoadingData}
                            locale={{
                                emptyText: isLoadingData ? (
                                    <Skeleton active paragraph={{ rows: 3 }} />
                                ) : (
                                    <Empty description="Không có dữ liệu" />
                                ),
                            }}
                        />
                    </RefreshableCard>
                </Col>

                {/* Recent Activities */}
                <Col xs={24} lg={12}>
                    <RefreshableCard
                        title={viTranslations.recentActivities}
                        extra={<Badge count={recentActivities.length} overflowCount={99} />}
                        loading={isLoadingData}
                    >
                        {isLoadingData ? (
                            <Skeleton active paragraph={{ rows: 6 }} />
                        ) : recentActivities.length === 0 ? (
                            <Empty description="Không có hoạt động gần đây" />
                        ) : (
                            <Timeline
                                items={recentActivities.map((activity: RecentActivity) => ({
                                    color:
                                        activity.type === 'movie_add'
                                            ? 'green'
                                            : activity.type === 'movie_update'
                                            ? 'blue'
                                            : 'orange',
                                    children: (
                                        <>
                                            <p>{activity.message}</p>
                                            <Text type="secondary">
                                                {new Date(activity.timestamp).toLocaleString(
                                                    'vi-VN',
                                                )}
                                            </Text>
                                        </>
                                    ),
                                }))}
                            />
                        )}
                    </RefreshableCard>
                </Col>
            </Row>
        </div>
    );
};

export default MovieStatsDashboard;
