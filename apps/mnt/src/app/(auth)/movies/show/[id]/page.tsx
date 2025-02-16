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
    Skeleton,
} from 'antd';
import {
    PlayCircleOutlined,
    LinkOutlined,
    SearchOutlined,
    EyeOutlined,
    CalendarOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { MovieType, EpisodeType, EpisodeServerDataType } from '~api/app/movies/movie.type';
import { ActorType } from '~api/app/actors/actor.type';
import { CategoryType } from '~api/app/categories/category.type';
import { GET_FULL_MOVIE_DETAIL_QUERY } from '~mnt/queries/movie.query';
import { EditMovieButton } from '~mnt/components/button/edit-movie-button';
import { DirectorType } from '~api/app/directors/director.type';
import { useRouter } from 'next/navigation';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

export default function MovieShowPage({ params }: { params: { id: string } }) {
    const router = useRouter();
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
                className="h-full transition-all duration-300 hover:shadow-lg"
                size="small"
                styles={{
                    body: {
                        padding: '8px',
                    },
                }}
                onClick={() => {
                    router.push(`/${type}/edit/${people._id?.toString()}`);
                }}
            >
                <div className="aspect-[3/4] relative w-full mb-2 max-w-[160px] mx-auto">
                    {people.posterUrl ? (
                        <Image
                            alt={people.name}
                            src={people.posterUrl}
                            className="object-cover rounded-md"
                            width={160}
                            preview={{
                                maskClassName: 'rounded-md',
                                title: people.name,
                            }}
                            placeholder={
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
                                    <Skeleton.Image active className="w-full h-full" />
                                </div>
                            }
                            fallback="/api/placeholder/120/160"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
                            <UserOutlined className="text-4xl text-gray-400" />
                        </div>
                    )}
                </div>

                <Space direction="vertical" className="w-full" size={0}>
                    <Text strong className="text-base line-clamp-1" title={people.name}>
                        {people.name}
                    </Text>
                    {people.originalName && (
                        <Text
                            type="secondary"
                            className="text-xs line-clamp-1"
                            title={people.originalName}
                        >
                            {people.originalName}
                        </Text>
                    )}
                    {people.slug && (
                        <Text
                            className="text-xs text-gray-500 italic line-clamp-1"
                            title={`${people.slug}`}
                        >
                            {people.slug}
                        </Text>
                    )}
                </Space>
            </Card>
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
                                    <Paragraph>{record?.slug}</Paragraph>
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
                            <TabPane tab="Credits" key="2">
                                <div className="space-y-6">
                                    {/* Directors Section */}
                                    <div>
                                        <Title level={5} className="mb-4">
                                            Director
                                        </Title>
                                        {record?.directors && record.directors.length > 0 ? (
                                            <List
                                                grid={{ gutter: 16, xs: 2, sm: 3, md: 4, lg: 6 }}
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
                                            <div className="text-center py-4">
                                                <Text type="secondary">
                                                    No director information available
                                                </Text>
                                            </div>
                                        )}
                                    </div>

                                    <Divider />

                                    {/* Cast Section */}
                                    <div>
                                        <Title level={5} className="mb-4">
                                            Casts
                                        </Title>
                                        <List
                                            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
                                            dataSource={record?.actors || []}
                                            renderItem={(actor: ActorType) => (
                                                <List.Item>
                                                    <PeopleCard type="actors" people={actor} />
                                                </List.Item>
                                            )}
                                            locale={{
                                                emptyText: (
                                                    <div className="py-8 text-center">
                                                        <UserOutlined className="text-4xl text-gray-300 mb-2" />
                                                        <Text type="secondary">
                                                            No cast members available
                                                        </Text>
                                                    </div>
                                                ),
                                            }}
                                        />
                                    </div>
                                </div>
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
