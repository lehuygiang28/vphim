'use client';

import { Descriptions, Tag, Typography, Image, Row, Col, Tabs } from 'antd';
import { Show, ListButton } from '@refinedev/antd';
import { useCustom, useParsed, useShow } from '@refinedev/core';

import { type UserType } from '~api/app/users/user.type';
import type {} from 'apps/api/src/app/watch-history/inputs/get-watch-history-admin.input';
import type { WatchHistoryType } from 'apps/api/src/app/watch-history/watch-history.type';

import { BlockLogTable } from '~mnt/components/table/block-log';
import { BlockOrUnblockUser } from '~mnt/components/button/block-or-unblock-user';
import { UpdateUserRole } from '~mnt/components/button/change-role';
import { formatDateToHumanReadable } from '@/libs/utils/common';
import { GET_WATCH_HISTORY_ADMIN } from '~mnt/queries/watch-history.query';
import { WatchHistoryTable } from '~mnt/components/table/watch-history';

const { Text } = Typography;

export default function UserShow() {
    const { id } = useParsed();

    const {
        query: { data: { data: record } = {}, isLoading },
    } = useShow<UserType>({});

    const {
        data: historyData,
        isLoading: isHistoryLoading,
        refetch,
    } = useCustom<{ data: WatchHistoryType[]; total: number }>({
        dataProviderName: 'graphql',
        url: 'graphql',
        method: 'post',
        meta: {
            gqlQuery: GET_WATCH_HISTORY_ADMIN,
            operation: 'getWatchHistoryAdmin',
            variables: {
                input: {
                    userId: record?._id.toString(),
                },
            },
        },
        queryOptions: {
            enabled: !!record?._id,
        },
    });

    return (
        <Show
            canEdit={false}
            isLoading={isLoading}
            title="Thông tin người dùng"
            headerButtons={({ listButtonProps }) => (
                <>
                    <ListButton {...listButtonProps}>Danh sách người dùng</ListButton>
                    <BlockOrUnblockUser idParam={id} user={record} />
                    <UpdateUserRole user={record} idParam={id} />
                </>
            )}
        >
            <div>
                <Row style={{ width: '100%' }}>
                    <Col xs={24} md={4}>
                        <Image src={record?.avatar?.url} width={100} alt="Ảnh đại diện" />
                    </Col>
                    <Col xs={24} md={18}>
                        <Descriptions>
                            <Descriptions.Item label="ID">
                                <Text copyable>{record?._id.toString()}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Họ tên">{record?.fullName}</Descriptions.Item>
                            <Descriptions.Item label="Email">
                                <Text copyable>{record?.email}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Xác thực email">
                                <Tag color={record?.emailVerified ? 'green' : 'red'}>
                                    {record?.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Vai trò">
                                <Tag color={record?.role === 'admin' ? 'geekblue' : 'green'}>
                                    {record?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                <Tag color={record?.block?.isBlocked ? 'red' : 'green'}>
                                    {record?.block?.isBlocked ? 'Đã khóa' : 'Đang hoạt động'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày tạo">
                                {record?.createdAt && formatDateToHumanReadable(record?.createdAt)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Cập nhật lần cuối">
                                {record?.updatedAt && formatDateToHumanReadable(record?.updatedAt)}
                            </Descriptions.Item>
                        </Descriptions>
                    </Col>
                </Row>

                <Tabs
                    defaultActiveKey="1"
                    items={[
                        {
                            label: `Lịch sử xem (${historyData?.data?.data?.length || 0})`,
                            key: '1',
                            children: (
                                <WatchHistoryTable
                                    history={historyData?.data.data}
                                    loading={isHistoryLoading}
                                />
                            ),
                        },
                        {
                            label: `Lịch sử chặn (${record?.block?.activityLogs?.length || 0})`,
                            key: '3',
                            children: <BlockLogTable logs={record?.block?.activityLogs} />,
                        },
                    ]}
                />
            </div>
        </Show>
    );
}
