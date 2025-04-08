import React, { useState } from 'react';
import { useOne, useInvalidate } from '@refinedev/core';
import {
    Card,
    Row,
    Col,
    Typography,
    Button,
    Spin,
    Empty,
    message,
    Skeleton,
    Alert,
    Tooltip,
} from 'antd';
import { ReloadOutlined, LoadingOutlined } from '@ant-design/icons';
import type { DashboardData } from '~api/app/dashboard/dashboard.type';
import { MovieTypeEnum } from '~api/app/movies/movie.constant';

const { Title, Text } = Typography;

// Vietnamese translations
const viTranslations = {
    analyticsTitle: 'Thống Kê Phim',
    loading: 'Đang tải dữ liệu...',
    refreshing: 'Đang làm mới dữ liệu...',
    refreshButton: 'Làm Mới Dữ Liệu',
    refreshingButton: 'Đang Làm Mới...',
    retry: 'Thử Lại',
    loadData: 'Tải Dữ Liệu',
    error: 'Lỗi',
    errorDesc: 'Đã xảy ra lỗi khi tải dữ liệu thống kê.',
    noData: 'Không có dữ liệu thống kê.',
    successMessage: 'Dữ liệu đã được làm mới thành công!',
    errorMessage: 'Không thể làm mới dữ liệu thống kê',
    movieGrowth: 'Tăng Trưởng Phim (7 Ngày Qua)',
    userGrowth: 'Tăng Trưởng Người Dùng (7 Ngày Qua)',
    newMoviesAdded: 'Phim Thêm Mới',
    newUserRegistrations: 'Người Dùng Đăng Ký Mới',
    day: 'Ngày',
};

// Chart placeholder component that shows animated bars
const ChartPlaceholder: React.FC<{
    data: number[] | { count: number; date?: Date; type?: string }[];
    title: string;
    loading?: boolean;
    dateFormat?: boolean;
}> = ({ data, title, loading = false, dateFormat = true }) => {
    if (loading) {
        return <Skeleton active paragraph={{ rows: 5 }} />;
    }

    // Translate movie type function
    const translateMovieType = (type: MovieTypeEnum): string => {
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

    // Extract count values and original data for display
    const numericData = data.map((item) => (typeof item === 'number' ? item : item.count));
    const max = Math.max(...numericData, 1); // Avoid division by zero

    return (
        <div style={{ padding: '16px', height: '100%' }}>
            <div style={{ marginBottom: '16px' }}>
                <Text strong>{title}</Text>
            </div>
            <div
                style={{
                    display: 'flex',
                    height: '200px',
                    alignItems: 'flex-end',
                    gap: '8px',
                    paddingTop: '30px', // Add space for value labels at top
                    position: 'relative',
                }}
            >
                {data.map((item, index) => {
                    const value = typeof item === 'number' ? item : item.count;
                    const heightPercent = Math.max((value / max) * 100, 4); // At least 4% height for visibility

                    // Format the label based on whether it's a date, type or simple index
                    let bottomLabel;
                    if (dateFormat && typeof item !== 'number' && item.date) {
                        const date = new Date(item.date);
                        bottomLabel = `${date.getDate()}/${date.getMonth() + 1}`;
                    } else if (!dateFormat && typeof item !== 'number' && item.type) {
                        bottomLabel = translateMovieType(item.type);
                    } else {
                        bottomLabel = `${viTranslations.day} ${index + 1}`;
                    }

                    return (
                        <Tooltip
                            key={index}
                            title={
                                <div style={{ textAlign: 'center' }}>
                                    <div>{value.toLocaleString('vi-VN')}</div>
                                    <div>{bottomLabel}</div>
                                </div>
                            }
                        >
                            <div
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    height: '100%',
                                    justifyContent: 'flex-end',
                                }}
                            >
                                {/* Value on top of bar */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {value.toLocaleString('vi-VN')}
                                </div>

                                {/* The bar itself */}
                                <div
                                    style={{
                                        width: '100%',
                                        height: `${heightPercent}%`,
                                        backgroundColor: value > 0 ? '#1890ff' : '#f0f0f0',
                                        borderRadius: '4px 4px 0 0',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                        transition: 'height 0.5s ease',
                                        position: 'relative',
                                    }}
                                />

                                {/* Bottom label */}
                                <div
                                    style={{
                                        marginTop: '8px',
                                        fontSize: '11px',
                                        textAlign: 'center',
                                        width: '100%',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {bottomLabel}
                                </div>
                            </div>
                        </Tooltip>
                    );
                })}
            </div>
        </div>
    );
};

// Custom card with improved loading animation
const RefreshableCard: React.FC<{
    title: string;
    loading: boolean;
    children: React.ReactNode;
}> = ({ title, loading, children }) => {
    return (
        <Card
            title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {title}
                    {loading && (
                        <Spin
                            indicator={
                                <LoadingOutlined style={{ fontSize: 14, marginLeft: 8 }} spin />
                            }
                            size="small"
                        />
                    )}
                </div>
            }
            className={loading ? 'refreshing-card' : ''}
            style={{
                position: 'relative',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}
            bodyStyle={{
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.3s ease',
            }}
        >
            {children}
            <style jsx global>{`
                .refreshing-card {
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

const MovieAnalytics: React.FC = () => {
    const invalidate = useInvalidate();
    const [refreshing, setRefreshing] = useState(false);

    const { data, isLoading, isError } = useOne<DashboardData>({
        resource: 'dashboard',
        id: '',
    });

    const handleRefresh = async () => {
        setRefreshing(true);
        message.loading({
            content: viTranslations.refreshing,
            key: 'analyticsRefresh',
            duration: 0,
        });

        try {
            await invalidate({
                resource: 'dashboard',
                invalidates: ['all'],
            });
            message.success({
                content: viTranslations.successMessage,
                key: 'analyticsRefresh',
                duration: 2,
            });
        } catch (error) {
            message.error({
                content: viTranslations.errorMessage,
                key: 'analyticsRefresh',
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
                <Spin size="large" tip={viTranslations.loading} />
            </div>
        );
    }

    if (isError && !refreshing) {
        return (
            <Card>
                <Empty
                    description={
                        <div>
                            <Alert
                                message={viTranslations.error}
                                description={viTranslations.errorDesc}
                                type="error"
                                showIcon
                            />
                        </div>
                    }
                />
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <Button
                        type="primary"
                        icon={refreshing ? <LoadingOutlined /> : <ReloadOutlined />}
                        onClick={handleRefresh}
                        loading={refreshing}
                        disabled={refreshing}
                    >
                        {viTranslations.retry}
                    </Button>
                </div>
            </Card>
        );
    }

    const dashboardData = data?.data;

    if (!dashboardData && !refreshing) {
        return (
            <Card>
                <Empty description={viTranslations.noData} />
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <Button
                        type="primary"
                        icon={refreshing ? <LoadingOutlined /> : <ReloadOutlined />}
                        onClick={handleRefresh}
                        loading={refreshing}
                        disabled={refreshing}
                    >
                        {viTranslations.loadData}
                    </Button>
                </div>
            </Card>
        );
    }

    // When refreshing but we have existing data, show the data with loading overlay
    if (refreshing && !dashboardData) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" tip={viTranslations.refreshing} />
            </div>
        );
    }

    const { movieGrowth = [], userGrowth = [] } = dashboardData || {};

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
                <Title level={3}>{viTranslations.analyticsTitle}</Title>
                <Button
                    type="primary"
                    icon={<ReloadOutlined spin={refreshing} />}
                    onClick={handleRefresh}
                    loading={refreshing}
                    disabled={refreshing}
                >
                    {refreshing ? viTranslations.refreshingButton : viTranslations.refreshButton}
                </Button>
            </div>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <RefreshableCard title={viTranslations.movieGrowth} loading={isLoadingData}>
                        <ChartPlaceholder
                            data={movieGrowth}
                            title={viTranslations.newMoviesAdded}
                            loading={isLoadingData}
                        />
                    </RefreshableCard>
                </Col>
                <Col xs={24} lg={12}>
                    <RefreshableCard title={viTranslations.userGrowth} loading={isLoadingData}>
                        <ChartPlaceholder
                            data={userGrowth}
                            title={viTranslations.newUserRegistrations}
                            loading={isLoadingData}
                        />
                    </RefreshableCard>
                </Col>
            </Row>
        </div>
    );
};

export default MovieAnalytics;
