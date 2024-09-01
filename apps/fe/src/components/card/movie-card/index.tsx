'use client';

import React from 'react';
import Image from 'next/image';
import { Card, Typography, Tag, Rate, Row, Col, Space } from 'antd';

const { Title, Text, Paragraph } = Typography;

interface MovieCardProps {
    title: string;
    year: number;
    director: string;
    categories: string[];
    rating: number;
    description: string;
    posterUrl: string;
    thumbUrl: string;
}

export default function MovieCard({ data }: { data: MovieCardProps }) {
    const { title, year, director, categories, rating, description, posterUrl, thumbUrl } = data;
    return (
        <Card
            style={{
                width: '100%',
                maxWidth: 1000,
                margin: '0 auto',
            }}
            styles={{
                body: { padding: 0, background: 'transparent', width: '100%' },
            }}
            bordered={false}
        >
            <Row
                style={{
                    background: 'transparent',
                    padding: '1rem',
                }}
            >
                <Col xs={24} md={16} style={{ padding: '1rem' }}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Title level={2} style={{ color: '#fff', marginBottom: 0 }}>
                            {title} ({year})
                        </Title>
                        <Text style={{ color: '#fff' }}>Directed by: {director}</Text>
                        <Space size={[0, 8]} wrap>
                            {categories.map((category) => (
                                <Tag key={category} color="blue">
                                    {category}
                                </Tag>
                            ))}
                        </Space>
                        <Rate disabled defaultValue={rating} />
                        <Paragraph style={{ color: '#fff' }}>{description}</Paragraph>
                    </Space>
                </Col>
                <Col xs={24} md={8} style={{ padding: '1rem' }}>
                    <Image
                        src={posterUrl}
                        alt={`${title} poster`}
                        width={300}
                        height={450}
                        layout="responsive"
                        objectFit="cover"
                        style={{ height: '100%' }}
                    />
                </Col>
            </Row>
        </Card>
    );
}
