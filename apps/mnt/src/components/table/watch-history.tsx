'use client';

import '~fe/libs/helper/dayjs';
import dayjs, { type Dayjs } from 'dayjs/esm';
import { useRouter } from 'next/navigation';
import { Table, Tag, Space, Typography, Button, DatePicker, Input, Image, Tooltip } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { EyeOutlined, SettingOutlined } from '@ant-design/icons';

import { formatDateToHumanReadable } from '@/libs/utils/common';
import type { WatchHistoryType } from 'apps/api/src/app/watch-history/watch-history.type';
import MovieTypeTag, { movieTypeOptions } from '../tag/movie-type-tag';
import { MovieTypeEnum } from '~api/app/movies/movie.constant';
import { resolveUrl } from '~api/libs/utils/common';
import { RouteNameEnum } from '@/constants/route.constant';

const { Text } = Typography;
const DATE_RANGE_SEPARATOR = '---';

export type WatchHistoryTableProps = {
    history?: WatchHistoryType[];
    loading?: boolean;
};

export function WatchHistoryTable({ history = [], loading = false }: WatchHistoryTableProps) {
    const router = useRouter();

    const columns: ColumnsType<WatchHistoryType> = [
        {
            key: 'movie',
            title: 'Phim',
            render: (_, record) => (
                <Space>
                    <Image
                        src={record.movieId?.thumbUrl}
                        alt={record.movieId?.name}
                        width={50}
                        height={70}
                        style={{ objectFit: 'cover' }}
                        preview={false}
                    />
                    <Space direction="vertical" size="small">
                        <Text strong>{record.movieId?.name}</Text>
                        <Text type="secondary">{record.movieId?.originName}</Text>
                    </Space>
                </Space>
            ),
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder="Tìm kiếm phim"
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
                const searchTerm = value.toString().toLowerCase();
                return (
                    record.movieId?.name.toLowerCase().includes(searchTerm) ||
                    record.movieId?.originName.toLowerCase().includes(searchTerm)
                );
            },
        },
        {
            key: 'serverName',
            title: 'Máy chủ',
            dataIndex: 'serverName',
            render: (serverName) => <Text>{serverName}</Text>,
            sorter: (a, b) => a.serverName.localeCompare(b.serverName),
        },
        {
            key: 'episode',
            title: 'Tập',
            dataIndex: 'episodeName',
            render: (episodeName) => <Text>{episodeName}</Text>,
            sorter: (a, b) => a.episodeName.localeCompare(b.episodeName),
        },
        {
            key: 'type',
            title: 'Loại',
            render: (_, record) => <MovieTypeTag type={record.movieId?.type as MovieTypeEnum} />,
            filters: movieTypeOptions.map((option) => ({
                text: option.label,
                value: option.value,
            })),
            onFilter: (value, record) => record.movieId?.type === value,
        },
        {
            key: 'progress',
            title: 'Tiến độ',
            render: (_, record) => {
                const { progress } = record;
                const percentComplete = Math.round(
                    (progress.currentTime / progress.duration) * 100,
                );
                const color = progress.completed
                    ? 'success'
                    : percentComplete > 90
                    ? 'warning'
                    : 'processing';

                return (
                    <Space>
                        <Tag color={color}>
                            {progress.completed ? 'Hoàn thành' : `${percentComplete}%`}
                        </Tag>
                        <Text type="secondary">
                            {Math.floor(progress.currentTime / 60)}:
                            {Math.floor(progress.currentTime % 60)
                                .toString()
                                .padStart(2, '0')}
                            {' / '}
                            {Math.floor(progress.duration / 60)}:
                            {Math.floor(progress.duration % 60)
                                .toString()
                                .padStart(2, '0')}
                        </Text>
                    </Space>
                );
            },
            filters: [
                { text: 'Hoàn thành', value: 'completed' },
                { text: 'Đang xem', value: 'in-progress' },
            ],
            onFilter: (value, record) => {
                if (value === 'completed') {
                    return record.progress.completed;
                }
                return !record.progress.completed;
            },
        },
        {
            key: 'lastWatched',
            title: 'Thời gian xem',
            dataIndex: 'lastWatched',
            sorter: (a, b) => new Date(a.lastWatched).getTime() - new Date(b.lastWatched).getTime(),
            defaultSortOrder: 'descend',
            render: (lastWatched) => formatDateToHumanReadable(lastWatched),
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
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
            ),
            onFilter: (value, record) => {
                if (value && value?.toString().includes(DATE_RANGE_SEPARATOR)) {
                    const [start, end] = (value as string).split(DATE_RANGE_SEPARATOR);
                    const watchTime = dayjs(record.lastWatched);
                    return (
                        watchTime.isAfter(dayjs(start), 'day') &&
                        watchTime.isBefore(dayjs(end), 'day')
                    );
                }
                return true;
            },
        },
        {
            key: 'actions',
            title: 'Hành động',
            render: (_, record) => {
                const watchUrl = resolveUrl(
                    `/${RouteNameEnum.MOVIE_PAGE}/${record.movieId?.slug}/${
                        record.episodeSlug || ''
                    }`,
                    process.env.NEXT_PUBLIC_FRONT_END_URL,
                );
                return (
                    <Space>
                        <Tooltip title="Xem phim">
                            <Button
                                icon={<EyeOutlined />}
                                onClick={() => window.open(watchUrl, '_blank')}
                                size="small"
                            />
                        </Tooltip>
                        <Tooltip title="Quản lý phim">
                            <Button
                                icon={<SettingOutlined />}
                                onClick={() =>
                                    router.push(`/movies/show/${record._id?.toString()}`)
                                }
                                size="small"
                            />
                        </Tooltip>
                    </Space>
                );
            },
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={history}
            loading={loading}
            rowKey={(record) => record._id.toString()}
            pagination={{
                defaultPageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
            }}
        />
    );
}
