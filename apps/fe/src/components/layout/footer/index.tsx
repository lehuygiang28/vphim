import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Layout, Row, Col, Typography, Grid, Divider, FloatButton } from 'antd';
import { stringifyTableParams } from '@refinedev/core';
import './footer.css';

import type { Category } from 'apps/api/src/app/categories/category.schema';
import type { Region } from 'apps/api/src/app/regions/region.schema';

import { RouteNameEnum } from '@/constants/route.constant';

const { Footer } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const { BackTop } = FloatButton;

const helperLinks = [
    { label: 'Về chúng tôi', url: '#' },
    { label: 'Liên hệ', url: 'mailto:contact@vephim.online' },
    { label: 'Điều khoản', url: '#' },
    { label: 'Chính sách bảo mật', url: '#' },
];

export type FooterComponentProps = {
    categories?: Category[];
    regions?: Region[];
};

export default function Component({ categories = [], regions = [] }: FooterComponentProps) {
    const screens = useBreakpoint();

    return (
        <>
            <BackTop />
            <Footer className="netflix-footer">
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
                            <Image
                                src="/assets/images/logo-mini.png"
                                alt="vphim Logo"
                                width={100}
                                height={30}
                                priority
                            />
                        </Link>
                        <Text className="netflix-footer-text">
                            Trang web xem phim trực tuyến miễn phí chất lượng cao với giao diện trực
                            quan, tốc độ tải trang nhanh, cùng kho phim với hơn 30.000+ phim mới,
                            phim hay, cập nhật mỗi ngày, hứa hẹn sẽ đem lại phút giây thư giãn cho
                            bạn.
                        </Text>
                    </Col>

                    <Col xs={24} sm={24} md={6} lg={6}>
                        <Title className="netflix-footer-heading" level={4}>
                            Thông tin
                        </Title>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {helperLinks.map((link, index) => (
                                <li key={`helper-link-${index}`} style={{ marginBottom: '0.5rem' }}>
                                    <Link className="netflix-footer-link" href={link.url}>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Col>

                    <Col xs={12} sm={12} md={6} lg={6}>
                        <Title className="netflix-footer-heading" level={5}>
                            Thể Loại
                        </Title>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {categories?.slice(0, 6)?.map((category, index) => (
                                <li
                                    key={`${category.slug}_${index}`}
                                    style={{ marginBottom: '0.5rem' }}
                                >
                                    <Link
                                        className="netflix-footer-link"
                                        href={`${
                                            RouteNameEnum.MOVIE_LIST_PAGE
                                        }?${stringifyTableParams({
                                            filters: [
                                                {
                                                    field: 'categories',
                                                    value: category.slug,
                                                    operator: 'in',
                                                },
                                            ],
                                            sorters: [],
                                        })}`}
                                    >
                                        {category.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Col>

                    <Col xs={12} sm={12} md={6} lg={6}>
                        <Title className="netflix-footer-heading" level={5}>
                            Quốc Gia
                        </Title>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {regions?.slice(0, 6)?.map((region, index) => (
                                <li
                                    key={`${region.slug}_${index}`}
                                    style={{ marginBottom: '0.5rem' }}
                                >
                                    <Link
                                        className="netflix-footer-link"
                                        href={`${
                                            RouteNameEnum.MOVIE_LIST_PAGE
                                        }?${stringifyTableParams({
                                            filters: [
                                                {
                                                    field: 'countries',
                                                    value: region.slug,
                                                    operator: 'in',
                                                },
                                            ],
                                            sorters: [],
                                        })}`}
                                    >
                                        {region.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Col>
                </Row>

                <Divider className="netflix-footer-divider" />
                <div className="netflix-footer-bottom">
                    <Text>
                        {new Date().getFullYear()} VePhim. Educational Project - Not for Commercial
                        Use.
                    </Text>

                    <Row justify="center" style={{ marginTop: '1rem' }}>
                        <Col xs={24} sm={20} md={18} lg={16} xl={14}>
                            <Text
                                strong
                                style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                Disclaimer
                            </Text>
                            <Text>
                                This website is a non-commercial, educational project created solely
                                for the purpose of learning web/app development techniques. All
                                content displayed on this site is sourced from publicly available
                                third-party APIs and is not hosted or owned by us. We do not claim
                                ownership of any content shown here. This project is not intended
                                for any commercial use. If you believe you own the rights to any
                                content displayed here and wish to claim ownership, please contact
                                us at{' '}
                                <a
                                    href="mailto:contact@vephim.online"
                                    className="netflix-footer-link"
                                >
                                    contact@vephim.online
                                </a>
                                . Users are advised to use this site at their own discretion and are
                                responsible for complying with all applicable laws and regulations
                                in their jurisdiction.
                            </Text>
                        </Col>
                    </Row>
                </div>
            </Footer>
        </>
    );
}
