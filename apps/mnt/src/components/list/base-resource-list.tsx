'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTable, List, EditButton, DeleteButton, CreateButton, DateField } from '@refinedev/antd';
import { Table, Space, Input, Form } from 'antd';
import { DocumentNode } from 'graphql';
import { noop } from 'antd/lib/_util/warning';
import { ColumnsType } from 'antd/es/table';
import { type Types } from 'mongoose';

export interface BaseResourceListProps<T> {
    resource: string;
    operation?: string;
    gqlQuery: DocumentNode;
    gqlDeleteMutation: DocumentNode;
    deleteOperation: string;
    createPath: string;
    columns?: ColumnsType<T>;
    showImage?: boolean;
}

export function BaseResourceList<
    T extends { _id: string | Types.ObjectId; name: string; updatedAt?: Date },
>({
    resource,
    operation,
    gqlQuery,
    gqlDeleteMutation,
    deleteOperation,
    createPath,
    columns = [],
    showImage = false,
}: BaseResourceListProps<T>) {
    const router = useRouter();
    const { tableProps, searchFormProps, current, pageSize, setFilters } = useTable<T>({
        dataProviderName: 'graphql',
        resource,
        meta: {
            gqlQuery,
            operation: operation || resource,
        },
        sorters: {
            mode: 'off',
        },
        filters: {
            mode: 'server',
            initial: [],
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

    const defaultColumns: ColumnsType<T> = [
        {
            title: 'No.',
            render: (_, __, index) => (current - 1) * pageSize + index + 1,
            width: 70,
        },
        ...columns,
        {
            dataIndex: 'name',
            title: 'Name',
            sorter: (a: T, b: T) => a.name.localeCompare(b.name),
        },
        {
            dataIndex: 'slug',
            title: 'Slug',
        },
        {
            dataIndex: 'updatedAt',
            title: 'Last Updated',
            render: (_, record: T) => (
                <DateField
                    value={new Date(record?.updatedAt?.toString())}
                    format="HH:mm DD/MM/YY"
                />
            ),
        },
        {
            title: 'Actions',
            dataIndex: 'actions',
            render: (_, record: T) => (
                <Space>
                    <EditButton hideText size="small" recordItemId={record?._id?.toString()} />
                    <DeleteButton
                        hideText
                        size="small"
                        recordItemId={record?._id?.toString()}
                        confirmTitle="Are you sure you want to delete, this action will be permanent?"
                        confirmOkText="Yes, delete"
                        confirmCancelText="No, don't delete"
                        dataProviderName="graphql"
                        resource={resource}
                        meta={{
                            gqlMutation: gqlDeleteMutation,
                            operation: deleteOperation,
                            variables: {
                                input: {
                                    _id: record?._id?.toString(),
                                },
                            },
                        }}
                        invalidates={['list', 'detail']}
                        mutationMode="undoable"
                    />
                </Space>
            ),
        },
    ];

    return (
        <List
            headerButtons={({ defaultButtons }) => (
                <>
                    {defaultButtons}
                    <CreateButton onClick={() => router.push(createPath)} />
                </>
            )}
        >
            <Space direction="vertical" style={{ width: '100%' }}>
                <Form {...searchFormProps} layout="inline" onFinish={noop}>
                    <Form.Item name="keywords">
                        <Input.Search
                            placeholder={`Search ${resource}`}
                            onSearch={handleSearch}
                            allowClear
                            autoComplete="off"
                        />
                    </Form.Item>
                </Form>
                <Table
                    {...tableProps}
                    rowKey="_id"
                    pagination={{
                        ...tableProps.pagination,
                        showSizeChanger: true,
                        pageSizeOptions: [10, 24, 50, 100, 200, 500],
                        showTotal: (total, range) =>
                            `Showing ${range[0]} to ${range[1]} of ${total} results`,
                        position: ['topRight', 'bottomRight'],
                        size: 'small',
                        simple: true,
                        responsive: true,
                    }}
                    size="small"
                    columns={[...defaultColumns]}
                />
            </Space>
        </List>
    );
}
