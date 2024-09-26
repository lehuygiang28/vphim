'use client';

import React, { useState, useCallback } from 'react';
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
} from 'antd';
import {
    PlayCircleOutlined,
    LinkOutlined,
    SearchOutlined,
    EyeOutlined,
    CalendarOutlined,
} from '@ant-design/icons';
import { MovieType, EpisodeType, EpisodeServerDataType } from '~api/app/movies/movie.type';
import { ActorType } from '~api/app/actors/actor.type';
import { CategoryType } from '~api/app/categories/category.type';
import { GET_FULL_MOVIE_DETAIL_QUERY } from '~mnt/queries/movie.query';
import { EditMovieButton } from '~mnt/components/button/edit-movie-button';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

export default function MovieShowPage({ params }: { params: { id: string } }) {
    const [activeTab, setActiveTab] = useState('1');
    const [activeServerIndex, setActiveServerIndex] = useState(0);
    const [searchTexts, setSearchTexts] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

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

    const renderEpisodes = (episodes: EpisodeType[]) => {
        return (
            <Tabs
                activeKey={activeServerIndex.toString()}
                onChange={(key) => {
                    setActiveServerIndex(Number(key));
                    setCurrentPage(1); // Reset to first page when changing server
                }}
                tabPosition="left"
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
                        <TabPane
                            tab={
                                server.serverName
                                    ? `${server?.originSrc ? `[${server?.originSrc}] ` : ''}${
                                          server.serverName
                                      }`
                                    : `Server ${index + 1}`
                            }
                            key={index}
                        >
                            <Input
                                placeholder="Search episodes"
                                prefix={<SearchOutlined />}
                                onChange={(e) => handleSearchChange(e.target.value, index)}
                                style={{ marginBottom: 16 }}
                                value={searchTexts[index] || ''}
                            />
                            <Table
                                dataSource={paginatedEpisodes}
                                columns={[
                                    {
                                        title: 'Name',
                                        dataIndex: 'name',
                                        key: 'name',
                                        sorter: (a, b) => a.name.localeCompare(b.name),
                                    },
                                    {
                                        title: 'Slug',
                                        dataIndex: 'slug',
                                        key: 'slug',
                                    },
                                    {
                                        title: 'Actions',
                                        key: 'actions',
                                        render: (_, episode: EpisodeServerDataType) => (
                                            <Space>
                                                {episode.linkEmbed && (
                                                    <Tooltip title="Watch Embed">
                                                        <Button
                                                            icon={<PlayCircleOutlined />}
                                                            href={episode.linkEmbed}
                                                            target="_blank"
                                                        />
                                                    </Tooltip>
                                                )}
                                                {episode.linkM3u8 && (
                                                    <Tooltip title="M3U8 Link">
                                                        <Button
                                                            icon={<LinkOutlined />}
                                                            href={episode.linkM3u8}
                                                            target="_blank"
                                                        />
                                                    </Tooltip>
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
                                }}
                            />
                        </TabPane>
                    );
                })}
            </Tabs>
        );
    };

    if (isError) {
        return <Alert message="Error loading movie data" type="error" />;
    }

    return (
        <Show
            isLoading={isLoading}
            headerButtons={({ refreshButtonProps }) => (
                <>
                    {params?.id && (
                        <>
                            <EditMovieButton id={params.id?.toString()} />
                            <DeleteButton recordItemId={params.id?.toString()} />
                            <RefreshButton
                                {...refreshButtonProps}
                                id={params.id?.toString()}
                                resource="movies"
                                dataProviderName="graphql"
                            />
                        </>
                    )}
                </>
            )}
        >
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={8}>
                    <Card
                        cover={
                            <Space direction="vertical">
                                <Image alt={`${record?.name} thumbnail`} src={record?.thumbUrl} />
                                <Image
                                    alt={`${record?.name} poster`}
                                    src={record?.posterUrl}
                                    style={{ marginTop: 10 }}
                                />
                            </Space>
                        }
                    >
                        <Card.Meta
                            title={<Title level={4}>{record?.name}</Title>}
                            description={
                                <>
                                    <Paragraph>{record?.originName}</Paragraph>
                                    <Space wrap>
                                        {record?.year && <Tag color="blue">{record?.year}</Tag>}
                                        {record?.quality && (
                                            <Tag color="green">{record?.quality}</Tag>
                                        )}
                                        {record?.lang && <Tag color="orange">{record?.lang}</Tag>}
                                        <Tag
                                            color={
                                                record?.status === 'completed'
                                                    ? 'success'
                                                    : 'processing'
                                            }
                                        >
                                            {record?.status}
                                        </Tag>
                                    </Space>
                                </>
                            }
                        />
                    </Card>
                    {(record?.imdb?.id || record?.tmdb?.id) && (
                        <Card style={{ marginTop: 16 }}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                {record.imdb?.id && (
                                    <Button
                                        icon={<LinkOutlined />}
                                        href={`https://www.imdb.com/title/${record.imdb.id}`}
                                        target="_blank"
                                        block
                                    >
                                        View on IMDB
                                    </Button>
                                )}
                                {record.tmdb?.id && (
                                    <Button
                                        icon={<LinkOutlined />}
                                        href={`https://www.themoviedb.org/${record.tmdb.type}/${record.tmdb.id}`}
                                        target="_blank"
                                        block
                                    >
                                        View on TMDB
                                    </Button>
                                )}
                            </Space>
                        </Card>
                    )}
                </Col>
                <Col xs={24} lg={16}>
                    <Card>
                        <Tabs activeKey={activeTab} onChange={setActiveTab}>
                            <TabPane tab="Details" key="1">
                                <Row gutter={[16, 16]}>
                                    <Col span={8}>
                                        <Statistic
                                            title="Views"
                                            value={record?.view || 0}
                                            prefix={<EyeOutlined />}
                                        />
                                    </Col>
                                    <Col span={8}>
                                        <Statistic
                                            title="Release Year"
                                            value={record?.year || 'N/A'}
                                            prefix={<CalendarOutlined />}
                                            formatter={(value) => value}
                                        />
                                    </Col>
                                    <Col span={8}>
                                        <Statistic
                                            title="Episodes"
                                            value={`${record?.episodeCurrent || 0}/${
                                                record?.episodeTotal && record.episodeTotal !== '0'
                                                    ? record.episodeTotal
                                                    : '?'
                                            }`}
                                            prefix={<PlayCircleOutlined />}
                                        />
                                    </Col>
                                </Row>
                                <Divider />
                                <Descriptions bordered column={1}>
                                    <Descriptions.Item label="Type">
                                        {record?.type}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Duration">
                                        {record?.time}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Cinema Release">
                                        {record?.cinemaRelease ? 'Yes' : 'No'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Is Copyright">
                                        {record?.isCopyright ? 'Yes' : 'No'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Sub Copyright">
                                        {record?.subDocquyen ? 'Yes' : 'No'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Showtimes">
                                        {record?.showtimes || 'N/A'}
                                    </Descriptions.Item>
                                </Descriptions>
                                <Divider orientation="left">Categories</Divider>
                                <Space wrap>
                                    {record?.categories?.map((category: CategoryType) => (
                                        <Tag color="blue" key={category._id?.toString()}>
                                            {category.name}
                                        </Tag>
                                    ))}
                                </Space>
                                <Divider orientation="left">Trailer</Divider>
                                {record?.trailerUrl ? (
                                    <Button
                                        icon={<PlayCircleOutlined />}
                                        href={record.trailerUrl}
                                        target="_blank"
                                    >
                                        Watch Trailer
                                    </Button>
                                ) : (
                                    <Text type="secondary">No trailer available</Text>
                                )}
                                <Divider orientation="left">Description</Divider>
                                <Paragraph>
                                    {record?.content || 'No description available.'}
                                </Paragraph>
                            </TabPane>
                            <TabPane tab="Cast" key="2">
                                <List
                                    grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
                                    dataSource={record?.actors || []}
                                    renderItem={(actor: ActorType) => (
                                        <List.Item>
                                            <Card
                                                hoverable
                                                cover={
                                                    <Image
                                                        alt={actor.name}
                                                        src={actor.thumbUrl}
                                                        fallback="/placeholder.svg?height=150&width=150"
                                                    />
                                                }
                                            >
                                                <Card.Meta
                                                    title={actor.name}
                                                    description={actor.slug}
                                                />
                                            </Card>
                                        </List.Item>
                                    )}
                                />
                            </TabPane>
                            <TabPane tab="Episodes" key="3">
                                {record?.episode && record.episode.length > 0 ? (
                                    renderEpisodes(record.episode)
                                ) : (
                                    <Alert message="No episodes available" type="info" />
                                )}
                            </TabPane>
                        </Tabs>
                    </Card>
                </Col>
            </Row>
        </Show>
    );
}
