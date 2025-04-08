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
    title?: string;
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
    title,
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
            title: 'STT',
            render: (_, __, index) => (current - 1) * pageSize + index + 1,
            width: 70,
        },
        ...columns,
        {
            dataIndex: 'name',
            title: 'Tên',
            sorter: (a: T, b: T) => a.name.localeCompare(b.name),
        },
        {
            dataIndex: 'slug',
            title: 'Slug',
        },
        {
            dataIndex: 'updatedAt',
            title: 'Cập nhật lần cuối',
            render: (_, record: T) => (
                <DateField
                    value={new Date(record?.updatedAt?.toString())}
                    format="HH:mm DD/MM/YY"
                />
            ),
        },
        {
            title: 'Thao tác',
            dataIndex: 'actions',
            render: (_, record: T) => (
                <Space>
                    <EditButton hideText size="small" recordItemId={record?._id?.toString()} />
                    <DeleteButton
                        hideText
                        size="small"
                        recordItemId={record?._id?.toString()}
                        confirmTitle="Bạn có chắc chắn muốn xóa, hành động này sẽ là vĩnh viễn?"
                        confirmOkText="Có, xóa"
                        confirmCancelText="Không, đừng xóa"
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
            title={title || <></>}
            headerButtons={({ defaultButtons }) => (
                <>
                    {defaultButtons}
                    <CreateButton title="Thêm mới" onClick={() => router.push(createPath)}>
                        Thêm mới
                    </CreateButton>
                </>
            )}
        >
            <Space direction="vertical" style={{ width: '100%' }}>
                <Form {...searchFormProps} layout="inline" onFinish={noop}>
                    <Form.Item name="keywords">
                        <Input.Search
                            placeholder={`Tìm kiếm ${resource}`}
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
                            `Hiển thị ${range[0]} đến ${range[1]} trên tổng ${total} kết quả`,
                        position: ['topRight', 'bottomRight'],
                        size: 'small',
                        simple: true,
                        responsive: true,
                        locale: {
                            items_per_page: 'bản ghi trên trang',
                            jump_to: 'Đến trang',
                            page: 'Trang',
                            prev_page: 'Trang trước',
                            next_page: 'Trang tiếp',
                            prev_5: '5 trang trước',
                            next_5: '5 trang tiếp',
                            prev_3: '3 trang trước',
                            next_3: '3 trang tiếp',
                            jump_to_confirm: 'Xác nhận',
                            page_size: 'Bản ghi trên trang',
                        },
                    }}
                    size="small"
                    columns={[...defaultColumns]}
                />
            </Space>
        </List>
    );
}
