'use client';

import { useShow } from '@refinedev/core';
import { Show, MarkdownField } from '@refinedev/antd';
import { Typography, Row, Col, Tag, Divider, List, Card, Avatar, Image, Space, Button } from 'antd';
import { PlayCircleOutlined, LinkOutlined } from '@ant-design/icons';
import { MovieType, EpisodeType } from '~api/app/movies/movie.type';
import { ActorType } from '~api/app/actors/actor.type';
import { CategoryType } from '~api/app/categories/category.type';
import { GET_FULL_MOVIE_DETAIL_QUERY } from '~mnt/queries/movie.query';

const { Title, Text, Paragraph } = Typography;

export type MovieShowPageProps = {
    params: {
        slug: string;
    };
};

export default function MovieShowPage({ params }: MovieShowPageProps) {
    const { query } = useShow<MovieType>({
        dataProviderName: 'graphql',
        resource: 'movies',
        id: params.slug,
        meta: {
            gqlQuery: GET_FULL_MOVIE_DETAIL_QUERY,
            operation: 'movie',
            variables: {
                input: {
                    slug: params.slug,
                },
            },
        },
    });
    const { data, isLoading } = query;
    const record = data?.data;

    const getAvatarProps = (name: string, imageUrl?: string) => {
        if (imageUrl) {
            return { src: imageUrl };
        }
        return { style: { backgroundColor: '#f56a00' }, children: name[0].toUpperCase() };
    };

    return (
        <Show isLoading={isLoading}>
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={8}>
                    <Card>
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            <Image
                                alt={record?.name}
                                src={record?.posterUrl || '/placeholder.svg?height=300&width=200'}
                                fallback="/placeholder.svg?height=300&width=200"
                            />
                            <Image
                                alt={`${record?.name} thumbnail`}
                                src={record?.thumbUrl || '/placeholder.svg?height=150&width=200'}
                                fallback="/placeholder.svg?height=150&width=200"
                            />
                            <Title level={4}>{record?.name}</Title>
                            <Paragraph type="secondary">{record?.originName}</Paragraph>
                            <Space>
                                {record?.year && <Tag color="blue">{record?.year}</Tag>}
                                {record?.quality && <Tag color="green">{record?.quality}</Tag>}
                                {record?.lang && <Tag color="orange">{record?.lang}</Tag>}
                            </Space>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} lg={16}>
                    <Card title="Details">
                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Text strong>Status:</Text> {record?.status}
                            </Col>
                            <Col span={12}>
                                <Text strong>Type:</Text> {record?.type}
                            </Col>
                            <Col span={12}>
                                <Text strong>Duration:</Text> {record?.time}
                            </Col>
                            <Col span={12}>
                                <Text strong>Episodes:</Text> {record?.episodeCurrent}/
                                {record?.episodeTotal}
                            </Col>
                            <Col span={12}>
                                <Text strong>Views:</Text> {record?.view}
                            </Col>
                            <Col span={12}>
                                <Text strong>Cinema Release:</Text>{' '}
                                {record?.cinemaRelease ? 'Yes' : 'No'}
                            </Col>
                            <Col span={24}>
                                <Text strong>Showtimes:</Text> {record?.showtimes}
                            </Col>
                        </Row>
                    </Card>

                    <Divider />

                    <Card title="Description">
                        <MarkdownField value={record?.content || ''} />
                    </Card>

                    <Divider />

                    <Card title="Actors">
                        <List
                            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
                            dataSource={record?.actors || []}
                            renderItem={(actor: ActorType) => (
                                <List.Item>
                                    <Card hoverable>
                                        <Card.Meta
                                            avatar={
                                                <Avatar
                                                    size={64}
                                                    {...getAvatarProps(actor.name, actor.thumbUrl)}
                                                />
                                            }
                                            title={actor.name}
                                            description={<Text ellipsis>{actor.slug}</Text>}
                                        />
                                    </Card>
                                </List.Item>
                            )}
                        />
                    </Card>

                    <Divider />

                    <Card title="Categories">
                        <Space wrap>
                            {record?.categories?.map((category: CategoryType) => (
                                <Tag key={category._id.toString()} color="blue">
                                    {category.name}
                                </Tag>
                            ))}
                        </Space>
                    </Card>

                    <Divider />

                    <Card title="Directors">
                        <Avatar.Group max={{ count: 5 }}>
                            {record?.directors?.map((director) => (
                                <Avatar
                                    key={director._id.toString()}
                                    {...getAvatarProps(director.name)}
                                />
                            ))}
                        </Avatar.Group>
                    </Card>

                    <Divider />

                    <Card title="Countries">
                        <Space wrap>
                            {record?.countries?.map((country) => (
                                <Tag key={country._id.toString()} color="green">
                                    {country.name}
                                </Tag>
                            ))}
                        </Space>
                    </Card>

                    {record?.episode && record.episode.length > 0 && (
                        <>
                            <Divider />
                            <Card title="Episodes">
                                <List
                                    dataSource={record.episode}
                                    renderItem={(item: EpisodeType) => (
                                        <List.Item>
                                            <Card title={item.serverName} style={{ width: '100%' }}>
                                                <List
                                                    dataSource={item.serverData}
                                                    renderItem={(server) => (
                                                        <List.Item>
                                                            <Space>
                                                                <Text>{server.name}</Text>
                                                                {server.linkEmbed && (
                                                                    <a
                                                                        href={server.linkEmbed}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                    >
                                                                        <Button
                                                                            icon={
                                                                                <PlayCircleOutlined />
                                                                            }
                                                                        >
                                                                            Watch
                                                                        </Button>
                                                                    </a>
                                                                )}
                                                                {server.linkM3u8 && (
                                                                    <a
                                                                        href={server.linkM3u8}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                    >
                                                                        <Button
                                                                            icon={<LinkOutlined />}
                                                                        >
                                                                            M3U8
                                                                        </Button>
                                                                    </a>
                                                                )}
                                                            </Space>
                                                        </List.Item>
                                                    )}
                                                />
                                            </Card>
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        </>
                    )}

                    {(record?.trailerUrl || record?.imdb?.id || record?.tmdb?.id) && (
                        <>
                            <Divider />
                            <Card title="Additional Information">
                                {record?.trailerUrl && (
                                    <Paragraph>
                                        <Text strong>Trailer:</Text>{' '}
                                        <a
                                            href={record.trailerUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Watch Trailer
                                        </a>
                                    </Paragraph>
                                )}
                                {record?.imdb?.id && (
                                    <Paragraph>
                                        <Text strong>IMDB:</Text>{' '}
                                        <a
                                            href={`https://www.imdb.com/title/${record.imdb.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {record.imdb.id}
                                        </a>
                                    </Paragraph>
                                )}
                                {record?.tmdb?.id && (
                                    <Paragraph>
                                        <Text strong>TMDB:</Text>{' '}
                                        <a
                                            href={`https://www.themoviedb.org/${record.tmdb.type}/${record.tmdb.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {record.tmdb.id}
                                        </a>
                                    </Paragraph>
                                )}
                            </Card>
                        </>
                    )}
                </Col>
            </Row>
        </Show>
    );
}
