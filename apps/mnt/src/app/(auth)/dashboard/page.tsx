'use client';

import React, { useState } from 'react';
import { Card, Tabs, Button, message, Spin } from 'antd';
import { ReloadOutlined, LoadingOutlined } from '@ant-design/icons';
import { useInvalidate } from '@refinedev/core';

import MovieStatsDashboard from '~mnt/components/dashboard/movie-stats-dashboard';
import MovieAnalytics from '~mnt/components/dashboard/movie-analytics';

// Vietnamese translations
const viTranslations = {
    dashboardTitle: 'Bảng Điều Khiển',
    refreshAllButton: 'Làm Mới Tất Cả Dữ Liệu',
    refreshingAll: 'Đang làm mới tất cả dữ liệu...',
    refreshSuccess: 'Tất cả dữ liệu đã được làm mới thành công!',
    refreshError: 'Không thể làm mới dữ liệu bảng điều khiển',
    overviewTab: 'Tổng Quan',
    analyticsTab: 'Phân Tích',
};

const DashboardPage: React.FC = () => {
    const invalidate = useInvalidate();
    const [activeKey, setActiveKey] = useState('overview');
    const [refreshingAll, setRefreshingAll] = useState(false);

    const handleRefreshAll = async () => {
        setRefreshingAll(true);
        message.loading({
            content: viTranslations.refreshingAll,
            key: 'dashboardRefreshAll',
            duration: 0,
        });

        try {
            await invalidate({
                resource: 'dashboard',
                invalidates: ['all'],
            });
            message.success({
                content: viTranslations.refreshSuccess,
                key: 'dashboardRefreshAll',
                duration: 2,
            });
        } catch (error) {
            message.error({
                content: viTranslations.refreshError,
                key: 'dashboardRefreshAll',
                duration: 3,
            });
        } finally {
            setRefreshingAll(false);
        }
    };

    const items = [
        {
            key: 'overview',
            label: viTranslations.overviewTab,
            children: <MovieStatsDashboard />,
        },
        {
            key: 'analytics',
            label: viTranslations.analyticsTab,
            children: <MovieAnalytics />,
        },
    ];

    return (
        <div style={{ padding: '20px' }}>
            <Spin spinning={refreshingAll} tip={viTranslations.refreshingAll}>
                <Card
                    title={
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span>{viTranslations.dashboardTitle}</span>
                            {refreshingAll && (
                                <LoadingOutlined
                                    style={{ marginLeft: 12, fontSize: 18, color: '#1890ff' }}
                                />
                            )}
                        </div>
                    }
                    bordered={false}
                    className={refreshingAll ? 'pulse-animation' : ''}
                    style={{
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    }}
                    extra={
                        <Button
                            type="primary"
                            icon={refreshingAll ? <LoadingOutlined /> : <ReloadOutlined />}
                            onClick={handleRefreshAll}
                            loading={refreshingAll}
                            disabled={refreshingAll}
                        >
                            {viTranslations.refreshAllButton}
                        </Button>
                    }
                >
                    <Tabs activeKey={activeKey} onChange={setActiveKey} items={items} />
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
            </Spin>
        </div>
    );
};

export default DashboardPage;
