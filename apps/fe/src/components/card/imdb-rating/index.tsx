import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Tag, Tooltip } from 'antd';

interface IMDBRatingProps {
    id: string;
    size?: 'small' | 'middle' | 'large';
}

interface IMDBData {
    imdbRating: [string, string];
}

export function IMDBRating({ id, size = 'middle' }: IMDBRatingProps) {
    const [data, setData] = useState<IMDBData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `https://data.ratings.media-imdb.com/${id}/data.json`,
                    {
                        next: {
                            revalidate: 360000,
                        },
                    },
                );
                if (!response.ok) {
                    throw new Error('Failed to fetch IMDB data');
                }
                const result: IMDBData = await response.json();
                setData(result);
            } catch (err) {
                setData({ imdbRating: ['N/A', 'N/A'] });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const tagSizes = {
        small: { height: '1.2rem', fontSize: '0.7rem' },
        middle: { height: '1.55rem', fontSize: '0.85rem' },
        large: { height: '2.5rem', fontSize: '1.15rem' },
    };

    const { height, fontSize } = tagSizes[size];

    if (!data || loading) {
        return <></>;
    }

    const [rating, votes] = data.imdbRating;

    return (
        <Link
            href={`https://www.imdb.com/title/${id}/`}
            target="_blank"
            referrerPolicy="no-referrer"
        >
            <Tooltip title={`${votes} đánh giá`} placement="top">
                <Tag
                    color="#f5c518"
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
                            backgroundColor: '#000000',
                            padding: `0 ${size === 'small' ? '0.2rem' : '0.4rem'}`,
                        }}
                    >
                        <Image
                            src="/assets/imdb_46x22.png"
                            alt="IMDB Logo"
                            width={46}
                            height={22}
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
                        {rating}
                    </span>
                </Tag>
            </Tooltip>
        </Link>
    );
}
