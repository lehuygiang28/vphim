'use client';

import { Descriptions, Tag, Typography, Image, Row, Col, Divider } from 'antd';
import { Show, ListButton } from '@refinedev/antd';
import { useParsed, useShow } from '@refinedev/core';

import { type UserType } from '~api/app/users/user.type';
import { BlockLogTable } from '~mnt/components/table/block-log';
import { BlockOrUnblockUser } from '~mnt/components/button/block-or-unblock-user';
import { UpdateUserRole } from '~mnt/components/button/change-role';
import { formatDateToHumanReadable } from '@/libs/utils/common';

const { Text } = Typography;

export default function UserShow() {
    const { id } = useParsed();

    const {
        query: { data: { data: record } = {}, isLoading },
    } = useShow<UserType>({});

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

                {record?.block?.activityLogs && (
                    <>
                        <Divider orientation="left">Lịch sử khóa tài khoản</Divider>
                        <BlockLogTable logs={record?.block?.activityLogs} />
                    </>
                )}
            </div>
        </Show>
    );
}
