import '~fe/libs/helper/dayjs';
import dayjs, { type Dayjs } from 'dayjs/esm';

import { Table, Tag, Input, DatePicker, Space, Button } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { useMany } from '@refinedev/core';

import type { UserDto } from '~api/app/users';
import { formatDateToHumanReadable } from '@/libs/utils/common';
const DATE_RANGE_SEPARATOR = '---';

export type BlockLogTableProps = {
    logs?: UserDto['block']['activityLogs'];
};

type ActivityLog = UserDto['block']['activityLogs'][0];

export function BlockLogTable({ logs = [] }: BlockLogTableProps) {
    const { data, isLoading, isError } = useMany({
        resource: 'users',
        ids: logs.map((log) => log?.actionBy?.toString()),
    });

    const columns: ColumnsType<ActivityLog> = [
        {
            key: 'action',
            title: 'Hành động',
            dataIndex: 'action',
            sorter: (a, b) => a.action.localeCompare(b.action),
            filters: [
                { text: 'Chặn', value: 'block' },
                { text: 'Bỏ chặn', value: 'unblock' },
            ],
            onFilter: (value, record) => record.action === value,
            render: (action) => {
                return (
                    <Tag color={action === 'block' ? 'red' : 'green'}>
                        {action === 'block' ? 'Chặn' : 'Bỏ chặn'}
                    </Tag>
                );
            },
        },
        {
            key: 'reason',
            title: 'Lý do',
            dataIndex: 'reason',
            sorter: (a, b) => a?.reason?.localeCompare(b?.reason),
        },
        {
            key: 'note',
            title: 'Ghi chú',
            dataIndex: 'note',
            sorter: (a, b) => a?.note?.localeCompare(b?.note),
        },
        {
            key: 'actionAt',
            title: 'Thời gian thực hiện',
            dataIndex: 'actionAt',
            sorter: (a, b) => new Date(a.actionAt).getTime() - new Date(b.actionAt).getTime(),
            render: (actionAt) => formatDateToHumanReadable(actionAt),
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
                return (
                    <Space direction="vertical">
                        <DatePicker.RangePicker
                            style={{ marginBottom: 8 }}
                            value={
                                selectedKeys[0] &&
                                selectedKeys[0].toString().includes(DATE_RANGE_SEPARATOR)
                                    ? (selectedKeys[0]
                                          .toString()
                                          .split(DATE_RANGE_SEPARATOR)
                                          .map((d) => dayjs(d)) as [Dayjs, Dayjs] as never)
                                    : null
                            }
                            onChange={(dates) => {
                                if (dates) {
                                    setSelectedKeys([
                                        dayjs(dates[0]).startOf('day').toISOString() +
                                            DATE_RANGE_SEPARATOR +
                                            dayjs(dates[1]).endOf('day').toISOString(),
                                    ]);
                                } else {
                                    setSelectedKeys([]);
                                }
                            }}
                        />
                        <Space>
                            <Button onClick={() => confirm()} type="primary">
                                Tìm kiếm
                            </Button>
                            <Button
                                onClick={() => {
                                    clearFilters();
                                    setSelectedKeys([]);
                                }}
                                type="dashed"
                            >
                                Đặt lại
                            </Button>
                        </Space>
                    </Space>
                );
            },
            onFilter: (value, record) => {
                if (value && value?.toString().includes(DATE_RANGE_SEPARATOR)) {
                    const [start, end] = (value as string).split(DATE_RANGE_SEPARATOR);
                    const actionAt = dayjs(record.actionAt);
                    return (
                        actionAt.isAfter(dayjs(start), 'day') &&
                        actionAt.isBefore(dayjs(end), 'day')
                    );
                }
                return true;
            },
        },
        {
            key: 'actionBy',
            title: 'Người thực hiện',
            dataIndex: 'actionBy',
            sorter: (a, b) => a.actionBy.toString().localeCompare(b.actionBy.toString()),
            render: (actionBy) => {
                const users = data?.data?.['data'] as unknown as UserDto[];
                const user = users?.find((user) => user?._id.toString() === actionBy.toString());
                return user?.email || 'N/A';
            },
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder="Tìm kiếm email"
                        value={selectedKeys[0]}
                        onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                        onPressEnter={() => confirm()}
                        style={{ width: 188, marginBottom: 8, display: 'block' }}
                    />
                    <Space>
                        <Button onClick={() => confirm()} type="primary">
                            Tìm kiếm
                        </Button>
                        <Button onClick={() => clearFilters()} type="dashed">
                            Đặt lại
                        </Button>
                    </Space>
                </div>
            ),
            onFilter: (value, record) => {
                const users = data?.data?.['data'] as unknown as UserDto[];
                const user = users?.find(
                    (user) => user?._id.toString() === record.actionBy.toString(),
                );
                return user?.email.includes(value as never);
            },
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={logs}
            loading={isLoading || isError}
            rowKey={(record) => record.actionAt.toString()}
        />
    );
}
