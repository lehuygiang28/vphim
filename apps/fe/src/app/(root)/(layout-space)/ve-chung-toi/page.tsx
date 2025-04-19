'use client';

import React from 'react';
import Image from 'next/image';
import { Typography, Divider, Button, Row, Col, Card } from 'antd';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

const { Title, Text, Paragraph } = Typography;

export default function AboutPage() {
    const features = [
        {
            title: 'Tìm kiếm AI',
            icon: '🤖',
            description: 'Hệ thống tìm kiếm thông minh với AI hiểu được sở thích của bạn.',
        },
        {
            title: 'Phát trực tuyến siêu nhanh',
            icon: '⚡',
            description:
                'Trải nghiệm xem phim mượt mà, chất lượng cao với công nghệ phát trực tuyến tiên tiến.',
        },
        {
            title: 'Đa nền tảng',
            icon: '📱',
            description:
                'Sử dụng VePhim trên trình duyệt hoặc thiết bị di động với ứng dụng native.',
        },
        {
            title: 'Khám phá thông minh',
            icon: '🔍',
            description:
                'Tìm kiếm nội dung mới thông qua gợi ý thông minh dựa trên lịch sử xem và sở thích.',
        },
        {
            title: 'Bộ sưu tập cá nhân',
            icon: '💾',
            description: 'Tạo tài khoản miễn phí để lưu phim yêu thích, theo dõi lịch sử xem.',
        },
        {
            title: 'Trải nghiệm sạch',
            icon: '🛡️',
            description: 'Tận hưởng trải nghiệm không quảng cáo, tập trung vào nội dung.',
        },
    ];

    return (
        <div style={{ padding: '32px 16px' }}>
            <div
                style={{
                    textAlign: 'center',
                    marginBottom: 48,
                    background:
                        'linear-gradient(to bottom, var(--vphim-color-primary) 0%, transparent 100%)',
                    padding: 32,
                    borderRadius: 8,
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
                    <div
                        style={{
                            position: 'relative',
                            width: 128,
                            height: 30,
                            overflow: 'hidden',
                            borderRadius: 12,
                        }}
                    >
                        <Image
                            src="/assets/images/logo-mini.png"
                            alt="vphim Logo"
                            width={128}
                            height={30}
                            priority
                        />
                    </div>
                </div>
                <Title
                    level={4}
                    style={{ color: '#fff', marginBottom: 32, fontWeight: 'normal', opacity: 0.9 }}
                >
                    Xem phim trực tuyến, miễn phí và nhanh chóng
                </Title>

                <Paragraph
                    style={{
                        color: '#fff',
                        maxWidth: 768,
                        margin: '0 auto 24px',
                        textAlign: 'center',
                    }}
                >
                    VePhim là nền tảng xem phim trực tuyến miễn phí với giao diện hiện đại và nhiều
                    tính năng hấp dẫn. Coi VePhim như thư viện phim cá nhân, có thể truy cập mọi lúc
                    mọi nơi miễn là có kết nối Internet.
                </Paragraph>
            </div>

            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <Title level={3} style={{ marginBottom: 24 }}>
                    Tính năng nổi bật
                </Title>

                <Row gutter={[24, 24]} style={{ marginBottom: 48 }}>
                    {features.map((feature, index) => (
                        <Col xs={24} sm={12} md={8} key={index}>
                            <Card style={{ height: '100%' }}>
                                <div style={{ fontSize: 30, marginBottom: 16 }}>{feature.icon}</div>
                                <Title level={5} style={{ marginBottom: 8 }}>
                                    {feature.title}
                                </Title>
                                <Text>{feature.description}</Text>
                            </Card>
                        </Col>
                    ))}
                </Row>

                <Divider />

                <Title level={3} style={{ marginBottom: 24 }}>
                    Công nghệ sử dụng
                </Title>

                <Row gutter={[48, 24]} style={{ marginBottom: 48 }}>
                    <Col xs={24} md={8}>
                        <Title level={4} style={{ marginBottom: 16 }}>
                            Frontend
                        </Title>
                        <ul style={{ paddingLeft: 20 }}>
                            <li style={{ marginBottom: 8 }}>Next.js & React</li>
                            <li style={{ marginBottom: 8 }}>Ant Design</li>
                            <li style={{ marginBottom: 8 }}>Vidstack (Media Player)</li>
                        </ul>
                    </Col>

                    <Col xs={24} md={8}>
                        <Title level={4} style={{ marginBottom: 16 }}>
                            Backend
                        </Title>
                        <ul style={{ paddingLeft: 20 }}>
                            <li style={{ marginBottom: 8 }}>NestJS</li>
                            <li style={{ marginBottom: 8 }}>MongoDB</li>
                            <li style={{ marginBottom: 8 }}>Redis & Elasticsearch</li>
                            <li style={{ marginBottom: 8 }}>Google Gemini</li>
                        </ul>
                    </Col>

                    <Col xs={24} md={8}>
                        <Title level={4} style={{ marginBottom: 16 }}>
                            Mobile
                        </Title>
                        <ul style={{ paddingLeft: 20 }}>
                            <li style={{ marginBottom: 8 }}>React Native & Expo</li>
                            <li style={{ marginBottom: 8 }}>UI Kitten</li>
                            <li style={{ marginBottom: 8 }}>Expo Video (Media Player)</li>
                        </ul>
                    </Col>
                </Row>

                <Divider />

                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                    <Title level={3} style={{ marginBottom: 16 }}>
                        Phiên bản
                    </Title>
                    <Text style={{ fontSize: 18 }}>1.0.0</Text>

                    <Paragraph
                        style={{
                            color: 'var(--vphim-color-text-secondary)',
                            maxWidth: '900px',
                            margin: '24px auto 0',
                        }}
                    >
                        VePhim được phát triển chỉ cho mục đích giáo dục và demo. Ứng dụng không lưu
                        trữ bất kỳ nội dung phim nào trên máy chủ của mình. Mọi nội dung đều được
                        tổng hợp từ các nguồn công khai trên Internet.
                    </Paragraph>
                </div>

                <div style={{ textAlign: 'center' }}>
                    <Link href="/lien-he">
                        <Button type="link" icon={<ExternalLink size={14} />}>
                            Liên hệ
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
