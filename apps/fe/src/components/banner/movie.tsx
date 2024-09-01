import type { CSSProperties } from 'react';
import { Typography, Image, Row, Col, Space, Grid } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

interface HeroProps {
    movie: {
        name: string;
        originName: string;
        content: string;
        thumbUrl: string;
        posterUrl: string;
        year: number;
        episodeCurrent: string;
    };
}

const Hero: React.FC<HeroProps> = ({ movie }) => {
    const { md } = useBreakpoint();

    const heroStyle: CSSProperties = {
        position: 'relative',
        height: '85vh',
        overflow: 'hidden',
    };

    const bgImageStyle: CSSProperties = {
        backgroundImage: `url(${movie.thumbUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(13px)',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
    };

    const contentStyle: CSSProperties = {
        padding: '2rem',
        textAlign: 'left',
        zIndex: 1,
        height: '100%',
    };

    const posterStyle: CSSProperties = {
        borderRadius: '1rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        width: '100%',
        height: '100%',
    };

    const textContentStyle: CSSProperties = {
        padding: '1rem',
        borderRadius: '8px',
        color: '#fff',
        textAlign: 'left',
    };

    return (
        <div style={heroStyle}>
            <div style={bgImageStyle} />
            <div style={contentStyle}>
                <Row justify="center" align="middle" style={{ height: '100%', width: '100%' }}>
                    <Col xs={{ span: 12 }} md={{ span: 16 }}>
                        <div style={textContentStyle}>
                            <Space direction="vertical">
                                <div>
                                    <Title level={1} style={{ marginBottom: '0' }}>
                                        {movie.name}
                                    </Title>
                                    <Text style={{ color: 'rgb(156, 163, 175)' }}>
                                        {movie.originName}
                                    </Text>
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <Space size={'middle'}>
                                            <span>
                                                <CalendarOutlined style={{ fontSize: '0.8rem' }} />
                                                <Text style={{ fontSize: '0.8rem' }}>
                                                    {' '}
                                                    {movie.year}
                                                </Text>
                                            </span>
                                            <Text style={{ fontSize: '0.8rem' }}>|</Text>
                                            <Text style={{ fontSize: '0.8rem' }}>
                                                {movie.episodeCurrent}
                                            </Text>
                                        </Space>
                                    </div>
                                </div>
                                {md && (
                                    <Paragraph
                                        ellipsis={{
                                            rows: 3,
                                            expandable: false,
                                            symbol: 'Xem thêm',
                                        }}
                                        style={{ maxWidth: '45vw' }}
                                    >
                                        {movie.content}
                                    </Paragraph>
                                )}
                            </Space>
                        </div>
                    </Col>
                    <Col xs={{ span: 12 }} md={{ span: 8 }}>
                        <Image
                            src={movie.posterUrl}
                            alt={movie.name}
                            width={300}
                            style={posterStyle}
                        />
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default Hero;
