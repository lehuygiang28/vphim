'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { HttpError, useInvalidate } from '@refinedev/core';
import { List, useTable, RefreshButton, ShowButton } from '@refinedev/antd';
import { Space, Table, Tag, Tooltip, Avatar, Form, Input } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { noop } from 'antd/lib/_util/warning';

import { type UserType } from '~api/app/users/user.type';
import { UserRoleEnum } from '~api/app/users/users.enum';
import { getOptimizedImageUrl } from '~fe/libs/utils/movie.util';

export default function UserList() {
    const router = useRouter();
    const invalidate = useInvalidate();
    const { tableProps, searchFormProps, setFilters } = useTable<UserType, HttpError>({
        resource: 'users',
        syncWithLocation: true,
        filters: {
            mode: 'server',
            initial: [],
        },
        pagination: {
            mode: 'server',
        },
        sorters: {
            mode: 'server',
            initial: [
                {
                    field: 'createdAt',
                    order: 'desc',
                },
            ],
        },
        onSearch: (values) => {
            return [
                {
                    field: 'keywords',
                    operator: 'contains',
                    value: values,
                },
            ];
        },
    });
    const handleSearch = useCallback(
        (value: string) => {
            if (!value) {
                setFilters([]);
            }
            setFilters([
                {
                    field: 'keywords',
                    operator: 'contains',
                    value,
                },
            ]);
        },
        [setFilters],
    );

    const columns: ColumnsType<UserType> = [
        {
            key: 'avatar',
            dataIndex: ['avatar', 'url'],
            title: 'Ảnh đại diện',
            render: (url, record) => (
                <Tooltip title={record.fullName}>
                    <Avatar
                        src={
                            url &&
                            getOptimizedImageUrl(url, {
                                width: 50,
                                height: 50,
                                quality: 80,
                            })
                        }
                        size={'default'}
                        alt={record.fullName}
                        onClick={() => router.push(`/users/show/${record._id?.toString()}`)}
                        style={{ cursor: 'pointer' }}
                    >
                        {!url && record?.fullName[0]?.toUpperCase()}
                    </Avatar>
                </Tooltip>
            ),
        },
        {
            key: '_id',
            dataIndex: '_id',
            title: 'ID',
            onFilter: (value, record) => record._id.toString().indexOf(value.toString()) === 0,
            sorter: (a, b) => a._id.toString().localeCompare(b._id.toString()),
            sortDirections: ['descend', 'ascend'],
        },
        {
            key: 'email',
            dataIndex: 'email',
            title: 'Email',
            onFilter: (value, record) => record.email.indexOf(value.toString()) === 0,
            sorter: (a, b) => a.email.localeCompare(b.email),
            sortDirections: ['descend', 'ascend'],
        },
        {
            key: 'emailVerified',
            dataIndex: 'emailVerified',
            title: 'Xác thực email',
            onFilter: (value, record) => record.emailVerified === (value === 'true'),
            sorter: (a, b) => (a.emailVerified === b.emailVerified ? 0 : a.emailVerified ? -1 : 1),
            sortDirections: ['descend', 'ascend'],
            render: (value) => (
                <Tag color={value ? 'green' : 'red'}>{value ? 'Đã xác thực' : 'Chưa xác thực'}</Tag>
            ),
        },
        {
            key: 'fullName',
            dataIndex: 'fullName',
            title: 'Họ tên',
            onFilter: (value, record) => record.fullName.indexOf(value.toString()) === 0,
            sorter: (a, b) => a.fullName.localeCompare(b.fullName),
            sortDirections: ['descend', 'ascend'],
        },
        {
            key: 'followMovies',
            dataIndex: 'followMovies',
            title: 'Phim theo dõi',
            onFilter: (value, record) => record.followMovies.length > 0,
            sorter: (a, b) => a.followMovies.length - b.followMovies.length,
            sortDirections: ['descend', 'ascend'],
            render: (value) => value?.length || 0,
        },
        {
            key: 'role',
            dataIndex: 'role',
            title: 'Vai trò',
            onFilter: (value, record) => record.role.indexOf(value.toString()) === 0,
            sorter: (a, b) => a.role.localeCompare(b.role),
            sortDirections: ['descend', 'ascend'],
            render: (value) => (
                <Tag color={value === UserRoleEnum.Admin ? 'geekblue' : 'green'}>
                    {value === UserRoleEnum.Admin ? 'Quản trị viên' : 'Người dùng'}
                </Tag>
            ),
        },
        {
            key: 'status',
            dataIndex: ['block', 'isBlocked'],
            title: 'Trạng thái',
            filters: [
                { text: 'Đã khóa', value: true },
                { text: 'Đang hoạt động', value: false },
            ],
            onFilter: (value, record) => {
                const isBlocked = record.block?.isBlocked || false;
                return isBlocked === value;
            },
            sorter: (a, b) => {
                const statusA = a.block?.isBlocked || false;
                const statusB = b.block?.isBlocked || false;
                return statusA === statusB ? 0 : statusA ? -1 : 1; // Blocked users first
            },
            sortDirections: ['ascend', 'descend'],
            render: (isBlocked) => {
                const status = isBlocked ? 'Đã khóa' : 'Đang hoạt động';
                const color = isBlocked ? 'red' : 'green';
                return <Tag color={color}>{status}</Tag>;
            },
        },
        {
            key: 'actions',
            title: 'Thao tác',
            render: (_, record: UserType) => (
                <Space>
                    <ShowButton
                        hideText
                        size="small"
                        recordItemId={record._id.toString()}
                        title="Xem chi tiết"
                    />
                </Space>
            ),
        },
    ];

    return (
        <List
            title="Danh sách người dùng"
            headerButtons={({ defaultButtons }) => (
                <>
                    {defaultButtons}
                    <RefreshButton
                        onClick={() =>
                            invalidate({
                                resource: `users`,
                                invalidates: ['list'],
                            })
                        }
                    >
                        Làm mới
                    </RefreshButton>
                </>
            )}
        >
            <Space direction="vertical" style={{ width: '100%' }}>
                <Form {...searchFormProps} layout="inline" onFinish={noop}>
                    <Form.Item name="keywords">
                        <Input.Search
                            placeholder="Tìm kiếm người dùng..."
                            onSearch={handleSearch}
                            allowClear
                            autoComplete="off"
                        />
                    </Form.Item>
                </Form>
                <Table<UserType>
                    {...tableProps}
                    columns={columns}
                    rowKey={(record) => record._id.toString()}
                />
            </Space>
        </List>
    );
}
