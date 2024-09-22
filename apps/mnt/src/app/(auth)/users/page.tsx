'use client';

import { HttpError, useInvalidate } from '@refinedev/core';
import { List, useTable, RefreshButton, ShowButton } from '@refinedev/antd';
import { Space, Table, Tag } from 'antd';
import { ColumnsType } from 'antd/lib/table';

import { type UserType } from '~api/app/users/user.type';

export default function UserList() {
    const { tableProps } = useTable<UserType, HttpError>({
        resource: 'users',
        syncWithLocation: true,
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
    });
    const invalidate = useInvalidate();

    const columns: ColumnsType<UserType> = [
        {
            key: '_id',
            dataIndex: '_id',
            title: 'Id',
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
            title: 'Email Verified',
            onFilter: (value, record) => record.emailVerified === (value === 'true'),
            sorter: (a, b) => (a.emailVerified === b.emailVerified ? 0 : a.emailVerified ? -1 : 1),
            sortDirections: ['descend', 'ascend'],
            render: (value) => (
                <Tag color={value ? 'green' : 'red'}>{value ? 'verified' : 'unverified'}</Tag>
            ),
        },
        {
            key: 'fullName',
            dataIndex: 'fullName',
            title: 'Full Name',
            onFilter: (value, record) => record.fullName.indexOf(value.toString()) === 0,
            sorter: (a, b) => a.fullName.localeCompare(b.fullName),
            sortDirections: ['descend', 'ascend'],
        },
        {
            key: 'role',
            dataIndex: 'role',
            title: 'Role',
            onFilter: (value, record) => record.role.indexOf(value.toString()) === 0,
            sorter: (a, b) => a.role.localeCompare(b.role),
            sortDirections: ['descend', 'ascend'],
            render: (value) => <Tag color={value === 'admin' ? 'geekblue' : 'green'}>{value}</Tag>,
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (_, record: UserType) => (
                <Space>
                    <ShowButton hideText size="small" recordItemId={record._id.toString()} />
                </Space>
            ),
        },
    ];

    return (
        <List
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
                    />
                </>
            )}
        >
            <Table<UserType>
                {...tableProps}
                columns={columns}
                rowKey={(record) => record._id.toString()}
            />
        </List>
    );
}
