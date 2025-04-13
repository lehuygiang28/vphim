'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useShow } from '@refinedev/core';
import { Show, DeleteButton, RefreshButton } from '@refinedev/antd';
import {
    Typography,
    Row,
    Col,
    Card,
    Tag,
    Divider,
    List,
    Space,
    Button,
    Tabs,
    Table,
    Input,
    Tooltip,
    Descriptions,
    Alert,
    Image,
    Statistic,
    Skeleton,
    Empty,
    Badge,
    message,
} from 'antd';
import {
    PlayCircleOutlined,
    LinkOutlined,
    SearchOutlined,
    CalendarOutlined,
    UserOutlined,
    InfoCircleOutlined,
    TeamOutlined,
    PlaySquareOutlined,
    FundViewOutlined,
    RightCircleOutlined,
    CopyOutlined,
} from '@ant-design/icons';

import { MovieType, EpisodeType, EpisodeServerDataType } from '~api/app/movies/movie.type';
import { ActorType } from '~api/app/actors/actor.type';
import { CategoryType } from '~api/app/categories/category.type';
import { MovieTypeEnum } from '~api/app/movies/movie.constant';
import { DirectorType } from '~api/app/directors/director.type';

import { GET_FULL_MOVIE_DETAIL_QUERY } from '~mnt/queries/movie.query';
import { EditMovieButton } from '~mnt/components/button/edit-movie-button';
import { MovieTypeTag } from '~mnt/components/tag/movie-type-tag';

const { Title, Text, Paragraph } = Typography;

const contentRatingColors = {
    P: 'green',
    K: 'cyan',
    T13: 'blue',
    T16: 'orange',
    T18: 'volcano',
    C: 'red',
};

const contentRatingText = {
    P: 'Phù hợp mọi độ tuổi, không hạn chế',
    K: 'Dưới 13 tuổi cần có người lớn hướng dẫn',
    T13: 'Từ 13 tuổi trở lên',
    T16: 'Từ 16 tuổi trở lên',
    T18: 'Từ 18 tuổi trở lên',
    C: 'Không được phép phổ biến',
};

export default function MovieShowPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('1');
    const [activeServerIndex, setActiveServerIndex] = useState(0);
    const [searchTexts, setSearchTexts] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [messageApi, contextHolder] = message.useMessage();

    const { query } = useShow<MovieType>({
        dataProviderName: 'graphql',
        resource: 'movies',
        id: params.id,
        meta: {
            gqlQuery: GET_FULL_MOVIE_DETAIL_QUERY,
            operation: 'movie',
            variables: {
                input: {
                    _id: params.id,
                },
            },
        },
    });

    const { data, isLoading, isError } = query;
    const record = data?.data;

    const handleSearchChange = useCallback((value: string, serverIndex: number) => {
        setSearchTexts((prev) => {
            const newSearchTexts = [...prev];
            newSearchTexts[serverIndex] = value;
            return newSearchTexts;
        });
        setCurrentPage(1); // Reset to first page when searching
    }, []);

    const handlePageChange = (page: number, pageSize?: number) => {
        setCurrentPage(page);
        if (pageSize) setPageSize(pageSize);
    };

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text).then(
            () => {
                messageApi.success(`Đã sao chép ${type} vào clipboard`);
            },
            (err) => {
                messageApi.error('Không thể sao chép: ' + err);
            },
        );
    };

    const renderEpisodes = (episodes: EpisodeType[]) => {
        return (
            <Tabs
                activeKey={activeServerIndex.toString()}
                onChange={(key) => {
                    setActiveServerIndex(Number(key));
                    setCurrentPage(1); // Reset to first page when changing server
                }}
                tabPosition="left"
                type="card"
                style={{ marginTop: 16 }}
            >
                {episodes.map((server, index) => {
                    const filteredEpisodes =
                        server.serverData?.filter((episode) =>
                            episode.name
                                .toLowerCase()
                                .includes((searchTexts[index] || '').toLowerCase()),
                        ) || [];

                    const paginatedEpisodes = filteredEpisodes.slice(
                        (currentPage - 1) * pageSize,
                        currentPage * pageSize,
                    );

                    return (
                        <Tabs.TabPane
                            tab={
                                <span style={{ fontWeight: 500 }}>
                                    {server.serverName
                                        ? `${server?.originSrc ? `[${server?.originSrc}] ` : ''}${
                                              server.serverName
                                          }`
                                        : `Server ${index + 1}`}
                                </span>
                            }
                            key={index}
                        >
                            <Input
                                placeholder="Tìm kiếm tập phim"
                                prefix={<SearchOutlined />}
                                onChange={(e) => handleSearchChange(e.target.value, index)}
                                style={{ marginBottom: 16 }}
                                value={searchTexts[index] || ''}
                                allowClear
                            />
                            <Table
                                dataSource={paginatedEpisodes}
                                rowKey="slug"
                                columns={[
                                    {
                                        title: 'Tên',
                                        dataIndex: 'name',
                                        key: 'name',
                                        width: '25%',
                                        sorter: (a, b) => a.name.localeCompare(b.name),
                                        render: (text) => <Text strong>{text}</Text>,
                                    },
                                    {
                                        title: 'Slug',
                                        dataIndex: 'slug',
                                        key: 'slug',
                                        width: '25%',
                                        render: (text) => (
                                            <Space>
                                                <Text type="secondary" ellipsis={{ tooltip: text }}>
                                                    {text}
                                                </Text>
                                                <Tooltip title="Sao chép slug">
                                                    <Button
                                                        type="text"
                                                        icon={<CopyOutlined />}
                                                        size="small"
                                                        onClick={() =>
                                                            copyToClipboard(text, 'slug')
                                                        }
                                                    />
                                                </Tooltip>
                                            </Space>
                                        ),
                                    },
                                    {
                                        title: 'Liên kết & Thao tác',
                                        key: 'links',
                                        width: '50%',
                                        render: (_, episode: EpisodeServerDataType) => (
                                            <Space
                                                direction="vertical"
                                                size="small"
                                                style={{ width: '100%' }}
                                            >
                                                {episode.linkEmbed && (
                                                    <Space>
                                                        <Button
                                                            type="primary"
                                                            size="small"
                                                            icon={<PlayCircleOutlined />}
                                                            href={episode.linkEmbed}
                                                            target="_blank"
                                                        >
                                                            Xem nhúng
                                                        </Button>
                                                        <Text
                                                            ellipsis={{
                                                                tooltip: episode.linkEmbed,
                                                            }}
                                                        >
                                                            {episode.linkEmbed.length > 30
                                                                ? episode.linkEmbed.substring(
                                                                      0,
                                                                      30,
                                                                  ) + '...'
                                                                : episode.linkEmbed}
                                                        </Text>
                                                        <Tooltip title="Sao chép link nhúng">
                                                            <Button
                                                                type="text"
                                                                icon={<CopyOutlined />}
                                                                size="small"
                                                                onClick={() =>
                                                                    copyToClipboard(
                                                                        episode.linkEmbed || '',
                                                                        'link nhúng',
                                                                    )
                                                                }
                                                            />
                                                        </Tooltip>
                                                    </Space>
                                                )}
                                                {episode.linkM3u8 && (
                                                    <Space>
                                                        <Button
                                                            size="small"
                                                            icon={<LinkOutlined />}
                                                            href={episode.linkM3u8}
                                                            target="_blank"
                                                        >
                                                            M3U8
                                                        </Button>
                                                        <Text
                                                            ellipsis={{ tooltip: episode.linkM3u8 }}
                                                        >
                                                            {episode.linkM3u8.length > 30
                                                                ? episode.linkM3u8.substring(
                                                                      0,
                                                                      30,
                                                                  ) + '...'
                                                                : episode.linkM3u8}
                                                        </Text>
                                                        <Tooltip title="Sao chép link M3U8">
                                                            <Button
                                                                type="text"
                                                                icon={<CopyOutlined />}
                                                                size="small"
                                                                onClick={() =>
                                                                    copyToClipboard(
                                                                        episode.linkM3u8 || '',
                                                                        'link M3U8',
                                                                    )
                                                                }
                                                            />
                                                        </Tooltip>
                                                    </Space>
                                                )}
                                            </Space>
                                        ),
                                    },
                                ]}
                                pagination={{
                                    current: currentPage,
                                    pageSize: pageSize,
                                    total: filteredEpisodes.length,
                                    showSizeChanger: true,
                                    showQuickJumper: true,
                                    onChange: handlePageChange,
                                    onShowSizeChange: handlePageChange,
                                    showTotal: (total) => `Tổng cộng ${total} tập`,
                                }}
                                bordered
                            />
                        </Tabs.TabPane>
                    );
                })}
            </Tabs>
        );
    };

    const PeopleCard = ({
        type,
        people,
    }:
        | {
              type: 'actors';
              people: ActorType;
          }
        | {
              type: 'directors';
              people: DirectorType;
          }) => {
        return (
            <Card
                hoverable
                size="small"
                style={{ height: '100%', transition: 'all 0.3s', cursor: 'pointer' }}
                bodyStyle={{ padding: 12 }}
                onClick={() => {
                    // Card click should not trigger navigation now
                }}
            >
                <div style={{ marginBottom: 12, textAlign: 'center' }}>
                    {people.posterUrl ? (
                        <Image
                            alt={people.name}
                            src={people.posterUrl}
                            style={{
                                objectFit: 'cover',
                                borderRadius: 8,
                                maxWidth: 160,
                                margin: '0 auto',
                                cursor: 'zoom-in',
                            }}
                            width={160}
                            height={214}
                            preview={{
                                maskClassName: 'rounded-md',
                                title: people.name,
                            }}
                            placeholder={
                                <div
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: '#f0f0f0',
                                        borderRadius: 8,
                                    }}
                                >
                                    <Skeleton.Image
                                        active
                                        style={{ width: '100%', height: '100%' }}
                                    />
                                </div>
                            }
                        />
                    ) : (
                        <div
                            style={{
                                width: 160,
                                height: 214,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#f0f0f0',
                                borderRadius: 8,
                                margin: '0 auto',
                            }}
                        >
                            <UserOutlined style={{ fontSize: 32, color: '#bfbfbf' }} />
                        </div>
                    )}
                </div>

                <Space direction="vertical" style={{ width: '100%' }} size={0}>
                    <Text
                        strong
                        style={{
                            fontSize: 14,
                            display: 'block',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            cursor: 'pointer',
                            color: '#1677ff',
                        }}
                        title={people.name}
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/${type}/edit/${people._id?.toString()}`);
                        }}
                    >
                        {people.name}
                    </Text>
                    {people.originalName && (
                        <Text
                            type="secondary"
                            style={{
                                fontSize: 12,
                                display: 'block',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                            title={people.originalName}
                        >
                            {people.originalName}
                        </Text>
                    )}
                    {people.slug && (
                        <Text
                            style={{
                                fontSize: 12,
                                color: '#8c8c8c',
                                fontStyle: 'italic',
                                display: 'block',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                cursor: 'pointer',
                            }}
                            title={`${people.slug}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/${type}/edit/${people._id?.toString()}`);
                            }}
                        >
                            {people.slug}
                        </Text>
                    )}
                </Space>
            </Card>
        );
    };

    if (isError) {
        return <Alert message="Lỗi khi tải dữ liệu phim" type="error" showIcon />;
    }

    return (
        <Show
            title={
                <Title level={4}>{`Chi tiết phim "${record?.originName || record?.name}"`}</Title>
            }
            isLoading={isLoading}
            headerButtons={({ refreshButtonProps }) => (
                <Space>
                    {params?.id && (
                        <>
                            <EditMovieButton id={params.id?.toString()} />
                            <DeleteButton recordItemId={params.id?.toString()}>Xóa</DeleteButton>
                            <RefreshButton
                                {...refreshButtonProps}
                                id={params.id?.toString()}
                                resource="movies"
                                dataProviderName="graphql"
                            >
                                Làm mới
                            </RefreshButton>
                        </>
                    )}
                </Space>
            )}
        >
            {contextHolder}
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={8}>
                    <Card bordered>
                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                            {record?.posterUrl && (
                                <Image
                                    alt={`${record?.name} poster`}
                                    src={record?.posterUrl}
                                    style={{ maxWidth: '100%', borderRadius: 8 }}
                                />
                            )}
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <Title level={4} style={{ margin: '0 0 4px 0' }}>
                                {record?.name}
                            </Title>
                            {record?.originName && (
                                <Title
                                    level={5}
                                    type="secondary"
                                    style={{ fontWeight: 'normal', margin: '0 0 8px 0' }}
                                >
                                    {record?.originName}
                                </Title>
                            )}

                            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                                {record?.slug}
                            </Paragraph>

                            <Space wrap style={{ justifyContent: 'center', marginBottom: 16 }}>
                                {record?.year && (
                                    <Tag color="blue" style={{ padding: '4px 8px' }}>
                                        <CalendarOutlined /> {record?.year}
                                    </Tag>
                                )}
                                {record?.quality && (
                                    <Tag color="green" style={{ padding: '4px 8px' }}>
                                        {record?.quality}
                                    </Tag>
                                )}
                                {record?.lang && (
                                    <Tag color="orange" style={{ padding: '4px 8px' }}>
                                        {record?.lang}
                                    </Tag>
                                )}
                                <Tag
                                    color={
                                        record?.status === 'completed' ? 'success' : 'processing'
                                    }
                                    style={{ padding: '4px 8px' }}
                                >
                                    {record?.status === 'completed'
                                        ? 'Hoàn thành'
                                        : 'Đang cập nhật'}
                                </Tag>
                            </Space>
                        </div>

                        <Divider style={{ margin: '16px 0' }} />

                        <Row gutter={[16, 16]}>
                            <Col span={8}>
                                <Statistic
                                    title={<span style={{ fontSize: 14 }}>Lượt xem</span>}
                                    value={record?.view || 0}
                                    prefix={<FundViewOutlined />}
                                    valueStyle={{ fontSize: 18 }}
                                />
                            </Col>
                            <Col span={8}>
                                <Statistic
                                    title={<span style={{ fontSize: 14 }}>Năm phát hành</span>}
                                    value={record?.year || 'N/A'}
                                    prefix={<CalendarOutlined />}
                                    formatter={(value) => value}
                                    valueStyle={{ fontSize: 18 }}
                                />
                            </Col>
                            <Col span={8}>
                                <Statistic
                                    title={<span style={{ fontSize: 14 }}>Số tập</span>}
                                    value={`${record?.episodeCurrent || 0}/${
                                        record?.episodeTotal && record.episodeTotal !== '0'
                                            ? record.episodeTotal
                                            : '?'
                                    }`}
                                    prefix={<PlayCircleOutlined />}
                                    valueStyle={{ fontSize: 18 }}
                                />
                            </Col>
                        </Row>
                    </Card>

                    <Card
                        title={
                            <>
                                <InfoCircleOutlined /> Thông tin cơ bản
                            </>
                        }
                        style={{ marginTop: 16 }}
                        bordered
                        size="small"
                    >
                        <Descriptions
                            bordered
                            column={1}
                            size="small"
                            labelStyle={{ fontWeight: 500 }}
                        >
                            <Descriptions.Item label="Định dạng">
                                {record?.type ? (
                                    <MovieTypeTag type={record.type as MovieTypeEnum} />
                                ) : (
                                    'Chưa phân loại'
                                )}
                            </Descriptions.Item>
                            <Descriptions.Item label="Thời lượng">
                                {record?.time || 'Chưa cập nhật'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Phân loại độ tuổi">
                                {record?.contentRating ? (
                                    <Tag
                                        color={
                                            contentRatingColors[
                                                record.contentRating as keyof typeof contentRatingColors
                                            ] || 'default'
                                        }
                                    >
                                        {record.contentRating} -{' '}
                                        {contentRatingText[
                                            record.contentRating as keyof typeof contentRatingText
                                        ] || ''}
                                    </Tag>
                                ) : (
                                    'Chưa có'
                                )}
                            </Descriptions.Item>
                            <Descriptions.Item label="Phát hành rạp">
                                <Badge
                                    status={record?.cinemaRelease ? 'success' : 'default'}
                                    text={record?.cinemaRelease ? 'Có' : 'Không'}
                                />
                            </Descriptions.Item>
                            <Descriptions.Item label="Bản quyền">
                                <Badge
                                    status={record?.isCopyright ? 'success' : 'default'}
                                    text={record?.isCopyright ? 'Có' : 'Không'}
                                />
                            </Descriptions.Item>
                            <Descriptions.Item label="Sub độc quyền">
                                <Badge
                                    status={record?.subDocquyen ? 'success' : 'default'}
                                    text={record?.subDocquyen ? 'Có' : 'Không'}
                                />
                            </Descriptions.Item>
                            <Descriptions.Item label="Lịch chiếu">
                                {record?.showtimes || 'Chưa cập nhật'}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>

                    <Card
                        title={
                            <>
                                <LinkOutlined /> Liên kết
                            </>
                        }
                        style={{ marginTop: 16 }}
                        bordered
                        size="small"
                    >
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {record?.trailerUrl && (
                                <Button
                                    type="primary"
                                    icon={<PlayCircleOutlined />}
                                    href={record.trailerUrl}
                                    target="_blank"
                                    block
                                >
                                    Xem Trailer
                                </Button>
                            )}
                            {record?.imdb?.id && (
                                <Button
                                    icon={<LinkOutlined />}
                                    href={`https://www.imdb.com/title/${record.imdb.id}`}
                                    target="_blank"
                                    block
                                >
                                    Xem trên IMDB
                                </Button>
                            )}
                            {record?.tmdb?.id && (
                                <Button
                                    icon={<LinkOutlined />}
                                    href={`https://www.themoviedb.org/${record.tmdb.type}/${record.tmdb.id}`}
                                    target="_blank"
                                    block
                                >
                                    Xem trên TMDB
                                </Button>
                            )}
                        </Space>
                    </Card>

                    <Card
                        title={
                            <>
                                <RightCircleOutlined /> Thể loại
                            </>
                        }
                        style={{ marginTop: 16 }}
                        bordered
                        size="small"
                    >
                        {record?.categories && record.categories.length > 0 ? (
                            <Space wrap style={{ justifyContent: 'space-between' }}>
                                {record?.categories?.map((category: CategoryType) => (
                                    <Tag
                                        color="blue"
                                        key={category._id?.toString()}
                                        style={{ margin: '4px', padding: '4px 8px' }}
                                    >
                                        {category.name}
                                    </Tag>
                                ))}
                            </Space>
                        ) : (
                            <Empty
                                description="Chưa có thể loại"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        )}
                    </Card>
                </Col>

                <Col xs={24} lg={16}>
                    <Card bordered>
                        <Tabs
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            type="card"
                            size="large"
                            items={[
                                {
                                    key: '1',
                                    label: (
                                        <span>
                                            <InfoCircleOutlined /> Mô tả phim
                                        </span>
                                    ),
                                    children: (
                                        <>
                                            {record?.thumbUrl && (
                                                <div style={{ marginBottom: 16 }}>
                                                    <Image
                                                        alt={`${record?.name} thumb`}
                                                        src={record?.thumbUrl}
                                                        style={{
                                                            width: '100%',
                                                            maxHeight: 300,
                                                            objectFit: 'cover',
                                                            borderRadius: 8,
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            <Card
                                                title="Mô tả chi tiết"
                                                size="small"
                                                style={{ marginBottom: 16 }}
                                                bordered
                                            >
                                                <Paragraph
                                                    style={{ fontSize: 15, lineHeight: 1.8 }}
                                                >
                                                    {record?.content ||
                                                        'Không có mô tả chi tiết cho phim này.'}
                                                </Paragraph>
                                            </Card>
                                        </>
                                    ),
                                },
                                {
                                    key: '2',
                                    label: (
                                        <span>
                                            <TeamOutlined /> Diễn viên & Đạo diễn
                                        </span>
                                    ),
                                    children: (
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 24,
                                            }}
                                        >
                                            {/* Directors Section */}
                                            <Card
                                                title={
                                                    <Title level={5} style={{ margin: 0 }}>
                                                        Đạo diễn
                                                    </Title>
                                                }
                                                bordered
                                                size="small"
                                            >
                                                {record?.directors &&
                                                record.directors.length > 0 ? (
                                                    <List
                                                        grid={{
                                                            gutter: 16,
                                                            xs: 2,
                                                            sm: 3,
                                                            md: 4,
                                                            lg: 6,
                                                        }}
                                                        dataSource={record.directors}
                                                        renderItem={(director: DirectorType) => (
                                                            <List.Item>
                                                                <PeopleCard
                                                                    type="directors"
                                                                    people={director}
                                                                />
                                                            </List.Item>
                                                        )}
                                                    />
                                                ) : (
                                                    <Empty
                                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                        description="Không có thông tin đạo diễn"
                                                    />
                                                )}
                                            </Card>

                                            {/* Cast Section */}
                                            <Card
                                                title={
                                                    <Title level={5} style={{ margin: 0 }}>
                                                        Diễn viên
                                                    </Title>
                                                }
                                                bordered
                                                size="small"
                                            >
                                                {record?.actors && record.actors.length > 0 ? (
                                                    <List
                                                        grid={{
                                                            gutter: 16,
                                                            xs: 2,
                                                            sm: 3,
                                                            md: 4,
                                                            lg: 5,
                                                        }}
                                                        dataSource={record?.actors || []}
                                                        renderItem={(actor: ActorType) => (
                                                            <List.Item>
                                                                <PeopleCard
                                                                    type="actors"
                                                                    people={actor}
                                                                />
                                                            </List.Item>
                                                        )}
                                                    />
                                                ) : (
                                                    <Empty
                                                        image={
                                                            <UserOutlined
                                                                style={{
                                                                    fontSize: 48,
                                                                    color: '#bfbfbf',
                                                                }}
                                                            />
                                                        }
                                                        description="Không có thông tin diễn viên"
                                                    />
                                                )}
                                            </Card>
                                        </div>
                                    ),
                                },
                                {
                                    key: '3',
                                    label: (
                                        <span>
                                            <PlaySquareOutlined /> Tập phim
                                        </span>
                                    ),
                                    children: (
                                        <Card bordered size="small">
                                            {record?.episode && record.episode.length > 0 ? (
                                                renderEpisodes(record.episode)
                                            ) : (
                                                <Alert
                                                    message="Thông báo"
                                                    description="Không có tập phim nào cho phim này"
                                                    type="info"
                                                    showIcon
                                                    style={{ marginTop: 16 }}
                                                />
                                            )}
                                        </Card>
                                    ),
                                },
                            ]}
                        />
                    </Card>
                </Col>
            </Row>
        </Show>
    );
}
