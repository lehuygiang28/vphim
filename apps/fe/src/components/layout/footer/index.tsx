'use client';

import React from 'react';
import { Layout, Row, Col, Typography, Grid, Divider } from 'antd';
import Link from 'next/link';
import Image from 'next/image';

import type { Category } from 'apps/api/src/app/categories/category.schema';
import type { Region } from 'apps/api/src/app/regions/region.schema';

const { Footer } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const helperLinks = [
    { label: 'About Us', url: '/about' },
    { label: 'Contact', url: '/contact' },
    { label: 'Terms of Service', url: '/terms' },
    { label: 'Privacy Policy', url: '/privacy' },
];

export type FooterComponentProps = {
    categories?: Category[];
    regions?: Region[];
};

export default function FooterComponent({ categories = [], regions = [] }: FooterComponentProps) {
    const screens = useBreakpoint();

    return (
        <Footer
            style={{
                background: '#001529',
                padding: screens.md ? '1.5rem 3rem' : '1rem 1.5rem',
            }}
        >
            <Row
                gutter={[
                    { xs: 16, sm: 24, md: 32 },
                    { xs: 16, sm: 24, md: 32 },
                ]}
                justify="space-between"
                align="top"
            >
                <Col xs={24} sm={24} md={6} lg={6}>
                    <Link href="/" style={{ display: 'inline-block', marginBottom: '1rem' }}>
                        <Image src="/placeholder.svg" alt="vphim Logo" width={100} height={40} />
                    </Link>
                    <Text
                        style={{
                            color: 'rgba(255, 255, 255, 0.65)',
                            fontSize: '0.875rem',
                            display: 'block',
                        }}
                    >
                        Your ultimate destination for movies and TV shows.
                    </Text>
                </Col>

                <Col xs={24} sm={24} md={6} lg={6}>
                    <Title
                        level={4}
                        style={{ color: 'white', marginBottom: '1rem', fontSize: '1.125rem' }}
                    >
                        Helpful Links
                    </Title>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {helperLinks.map((link) => (
                            <li key={link.url} style={{ marginBottom: '0.5rem' }}>
                                <Link
                                    href={link.url}
                                    style={{
                                        color: 'rgba(255, 255, 255, 0.65)',
                                        fontSize: '0.875rem',
                                    }}
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Col>

                <Col xs={12} sm={12} md={6} lg={6}>
                    <Title
                        level={5}
                        style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1rem' }}
                    >
                        Thể Loại
                    </Title>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {categories?.slice(0, 6)?.map((category) => (
                            <li key={category.slug} style={{ marginBottom: '0.5rem' }}>
                                <Link
                                    href={`/the-loai/${category?.slug}`}
                                    style={{
                                        color: 'rgba(255, 255, 255, 0.65)',
                                        fontSize: '0.875rem',
                                    }}
                                >
                                    {category.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Col>

                <Col xs={12} sm={12} md={6} lg={6}>
                    <Title
                        level={5}
                        style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1rem' }}
                    >
                        Quốc Gia
                    </Title>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {regions?.slice(0, 6)?.map((region) => (
                            <li key={region.slug} style={{ marginBottom: '0.5rem' }}>
                                <Link
                                    href={`/the-loai/${region?.slug}`}
                                    style={{
                                        color: 'rgba(255, 255, 255, 0.65)',
                                        fontSize: '0.875rem',
                                    }}
                                >
                                    {region.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Col>
            </Row>

            <Divider />
            <Row justify="center" style={{ marginTop: '1.5rem' }}>
                <Col>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.75rem' }}>
                        © {new Date().getFullYear()} vphim. All rights reserved.
                    </Text>
                </Col>
            </Row>
        </Footer>
    );
}