'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTable, List, EditButton, DeleteButton, CreateButton } from '@refinedev/antd';
import { Table, Space, Input, Form } from 'antd';
import { noop } from 'antd/lib/_util/warning';

import { type CategoryType } from '~api/app/categories/category.type';
import { MNT_CATEGORIES_LIST_QUERY, MNT_CATEGORY_DELETE } from '~mnt/queries/category.query';

export default function CategoryList() {
    const router = useRouter();
    const { tableProps, searchFormProps, current, pageSize, setFilters } = useTable<CategoryType>({
        dataProviderName: 'graphql',
        resource: 'categories',
        meta: {
            gqlQuery: MNT_CATEGORIES_LIST_QUERY,
            operation: 'categories',
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

    return (
        <List
            headerButtons={({ defaultButtons }) => (
                <>
                    {defaultButtons}
                    <CreateButton onClick={() => router.push('/categories/create')} />
                </>
            )}
        >
            <Space direction="vertical" style={{ width: '100%' }}>
                <Form {...searchFormProps} layout="inline" onFinish={noop}>
                    <Form.Item name="keywords">
                        <Input.Search
                            placeholder="Search categories"
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
                >
                    <Table.Column
                        title="No."
                        render={(_, __, index) => (current - 1) * pageSize + index + 1}
                        width={70}
                    />
                    <Table.Column
                        dataIndex="name"
                        title="Name"
                        sorter={(a, b) => a.name.localeCompare(b.name)}
                    />
                    <Table.Column dataIndex="slug" title="Slug" />
                    <Table.Column
                        title="Actions"
                        dataIndex="actions"
                        render={(_, record: CategoryType) => (
                            <Space>
                                <EditButton
                                    hideText
                                    size="small"
                                    recordItemId={record?._id?.toString()}
                                />
                                <DeleteButton
                                    hideText
                                    size="small"
                                    recordItemId={record?._id?.toString()}
                                    confirmTitle="Are you sure you want to delete this category, this action will be permanent?"
                                    confirmOkText="Yes, delete"
                                    confirmCancelText='No, don"t delete'
                                    dataProviderName="graphql"
                                    resource="categories"
                                    meta={{
                                        gqlMutation: MNT_CATEGORY_DELETE,
                                        operation: 'deleteCategory',
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
                        )}
                    />
                </Table>
            </Space>
        </List>
    );
}
