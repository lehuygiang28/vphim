import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Tag, Tooltip } from 'antd';

interface TMDBRatingProps {
    id: string;
    type: string;
    size?: 'small' | 'middle' | 'large';
}

interface TMDBData {
    vote_average: number | string;
    vote_count: number | string;
}

export function TMDBRating({ id, type, size = 'middle' }: TMDBRatingProps) {
    const [data, setData] = useState<TMDBData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `https://api.themoviedb.org/3/${type}/${id}?language=en-US&api_key=${process?.env?.NEXT_PUBLIC_TMDB_API_KEY}`,
                    {
                        next: {
                            revalidate: 360000,
                        },
                    },
                );
                if (!response.ok) {
                    throw new Error('Failed to fetch TMDB data');
                }
                const result: TMDBData = await response.json();
                setData(result);
            } catch (err) {
                setData({ vote_average: 'N/A', vote_count: 'N/A' });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, type]);

    const tagSizes = {
        small: { height: '1.2rem', fontSize: '0.7rem' },
        middle: { height: '1.55rem', fontSize: '0.85rem' },
        large: { height: '2.5rem', fontSize: '1.15rem' },
    };

    const { height, fontSize } = tagSizes[size];

    if (!data || loading) {
        return <></>;
    }

    return (
        <Link
            href={id && type ? `https://www.themoviedb.org/${type}/${id}` : '#'}
            target="_blank"
            referrerPolicy="no-referrer"
        >
            <Tooltip title={`${data.vote_count} đánh giá`} placement="top">
                <Tag
                    color="#01b4e4"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: 0,
                        overflow: 'hidden',
                        border: 'none',
                        borderRadius: '0.25rem',
                        height: height,
                        fontSize: fontSize,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            width: 'auto',
                            backgroundColor: '#081c22',
                            padding: `0 ${size === 'small' ? '0.2rem' : '0.4rem'}`,
                        }}
                    >
                        <Image
                            src="/assets/tmdb.svg"
                            alt="TMDB Logo"
                            width={32}
                            height={16}
                            style={{
                                width: 'auto',
                                height: '60%',
                                objectFit: 'contain',
                            }}
                        />
                    </div>
                    <span
                        style={{
                            padding: `0 ${size === 'small' ? '0.2rem' : '0.4rem'}`,
                            fontWeight: 'bold',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {!isNaN(Number(data.vote_average))
                            ? Number(data.vote_average).toFixed(1)
                            : 'N/A'}
                    </span>
                </Tag>
            </Tooltip>
        </Link>
    );
}
