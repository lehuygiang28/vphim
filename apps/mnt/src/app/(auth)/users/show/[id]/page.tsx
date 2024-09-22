'use client';

import { Descriptions, Tag, Typography, Image, Row, Col, Divider } from 'antd';
import { Show } from '@refinedev/antd';
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
            headerButtons={({ defaultButtons }) => (
                <>
                    {defaultButtons}
                    <BlockOrUnblockUser idParam={id} user={record} />
                    <UpdateUserRole user={record} idParam={id} />
                </>
            )}
        >
            <div>
                <Row style={{ width: '100%' }}>
                    <Col xs={24} md={4}>
                        <Image src={record?.avatar?.url} width={100} alt="user avatar" />
                    </Col>
                    <Col xs={24} md={18}>
                        <Descriptions>
                            <Descriptions.Item label="ID">
                                <Text copyable>{record?._id.toString()}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Full Name">
                                {record?.fullName}
                            </Descriptions.Item>
                            <Descriptions.Item label="Email">
                                <Text copyable>{record?.email}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Email Verified">
                                <Tag color={record?.emailVerified ? 'green' : 'red'}>
                                    {record?.emailVerified ? 'verified' : 'unverified'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Role">
                                <Tag color={record?.role === 'admin' ? 'geekblue' : 'green'}>
                                    {record?.role}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Status">
                                <Tag color={record?.block?.isBlocked ? 'red' : 'green'}>
                                    {record?.block?.isBlocked ? 'blocked' : 'active'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Created At">
                                {record?.createdAt && formatDateToHumanReadable(record?.createdAt)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Updated At">
                                {record?.updatedAt && formatDateToHumanReadable(record?.updatedAt)}
                            </Descriptions.Item>
                        </Descriptions>
                    </Col>
                </Row>

                {record?.block?.activityLogs && (
                    <>
                        <Divider orientation="left">Block Logs</Divider>
                        <BlockLogTable logs={record?.block?.activityLogs} />
                    </>
                )}
            </div>
        </Show>
    );
}
