'use client';

import React, { FC } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Tag, Space } from 'antd';
import { CalendarOutlined, EyeOutlined, PlayCircleOutlined, StarOutlined } from '@ant-design/icons';

import type { MovieResponseDto } from 'apps/api/src/app/movies/dtos/movie-response.dto';

import { ImageOptimized } from '@/components/image/image-optimized';
import { MovieQualityTag } from '@/components/tag/movie-quality';
import { TMDBRating } from '@/components/card/tmdb-rating';
import { IMDBRating } from '@/components/card/imdb-rating';
import styles from './movie-card.module.css';

interface MovieCardProps {
    movie: MovieResponseDto;
    loadType?: 'lazy' | 'eager';
}

export const MovieCard: FC<MovieCardProps> = ({ movie, loadType }) => {
    const router = useRouter();

    const handleViewMovie = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        router.push(`/phim/${movie.slug}`);
    };

    // Create a formatted description
    const formatDescription = () => {
        if (!movie.content) return '';

        // Limit to a reasonable length (100 characters)
        const maxLength = 100;
        const text =
            movie.content.length > maxLength
                ? `${movie.content.substring(0, maxLength)}...`
                : movie.content;

        return text;
    };

    // Display average rating if available
    const renderAverageRating = () => {
        let rating = 0;
        let ratingCount = 0;

        if (movie.tmdb?.voteAverage) {
            rating += movie.tmdb.voteAverage;
            ratingCount++;
        }

        if (ratingCount === 0) return null;

        const finalRating = (rating / ratingCount).toFixed(1);

        return (
            <div className={styles.ratingBadge}>
                <StarOutlined /> {finalRating}
            </div>
        );
    };

    const renderRatings = () => {
        return (
            <div className={styles.ratings}>
                {movie.tmdb?.id && (
                    <TMDBRating id={movie.tmdb.id} type={movie.tmdb.type || 'movie'} size="small" />
                )}
                {movie.imdb?.id && <IMDBRating id={movie.imdb.id} size="small" />}
            </div>
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.link}>
                <div className={styles.poster}>
                    <div className={styles.imageWrapper}>
                        <ImageOptimized
                            alt={movie.name}
                            url={movie.posterUrl}
                            width={480}
                            height={854}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '0.5rem',
                            }}
                            loadType={loadType}
                        />
                    </div>

                    {movie.episodeCurrent && (
                        <Tag className={styles.episodeTag}>{movie.episodeCurrent}</Tag>
                    )}

                    <div className={styles.qualityTagWrapper}>
                        <MovieQualityTag quality={movie.quality || ''} />
                    </div>

                    {renderAverageRating()}

                    <div className={styles.overlay}>
                        <div className={styles.overlayContent}>
                            <h4 className={styles.title}>{movie.name}</h4>

                            <div className={styles.meta}>
                                <span className={styles.year}>{movie.year}</span>
                                {movie.view && (
                                    <span className={styles.views}>
                                        <EyeOutlined />{' '}
                                        {movie.view > 1000
                                            ? `${Math.floor(movie.view / 1000)}K`
                                            : movie.view}
                                    </span>
                                )}
                            </div>

                            {renderRatings()}

                            {movie.categories && movie.categories.length > 0 && (
                                <div className={styles.categories}>
                                    {movie.categories.slice(0, 2).map((category) => (
                                        <span
                                            key={category._id.toString()}
                                            className={styles.category}
                                        >
                                            {category.name}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <p className={styles.description}>{formatDescription()}</p>

                            <Space direction="vertical" style={{ width: '100%' }} size="small">
                                <Button
                                    type="primary"
                                    size="small"
                                    icon={<PlayCircleOutlined />}
                                    className={styles.watchNowBtn}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewMovie();
                                    }}
                                >
                                    Xem phim
                                </Button>
                            </Space>
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <Link href={`/phim/${movie.slug}`}>
                        <h5 className={styles.footerTitle}>{movie.name}</h5>
                    </Link>

                    <div className={styles.footerMeta}>
                        {movie.year && (
                            <span className={styles.yearSmall}>
                                <CalendarOutlined /> {movie.year}
                            </span>
                        )}

                        {movie.episodeCurrent && (
                            <span className={styles.episodeSmall}>{movie.episodeCurrent}</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
