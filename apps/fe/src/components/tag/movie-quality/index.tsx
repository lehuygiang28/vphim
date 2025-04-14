import React, { CSSProperties, PropsWithChildren } from 'react';
import { Tag, TagProps, Tooltip } from 'antd';
import Link from 'next/link';

import { MovieQualityEnum } from 'apps/api/src/app/movies/movie.constant';
import { createSearchUrl } from '@/libs/utils/url.util';
import styles from './movie-quality.module.css';

export type MovieQualityTagProps = {
    quality: string;
    style?: CSSProperties;
    showLabel?: boolean;
    size?: 'small' | 'middle' | 'large';
    withLink?: boolean;
    variant?: 'tag' | 'cardBadge';
    className?: string;
} & PropsWithChildren;

export function MovieQualityTag({
    quality,
    style = {},
    showLabel = false,
    size = 'middle',
    withLink = true,
    variant = 'tag',
    className = '',
    children,
}: MovieQualityTagProps) {
    if (!quality) return null;

    let color: TagProps['color'] = 'default';

    switch (quality.toLowerCase()) {
        case MovieQualityEnum._4K:
            color = 'red';
            break;
        case MovieQualityEnum.FHD:
            color = 'green';
            break;
        case MovieQualityEnum.HD:
            color = 'blue';
            break;
        case MovieQualityEnum.SD:
            color = 'cyan';
            break;
        case MovieQualityEnum.CAM:
            color = 'lime';
            break;
        default:
            color = 'default';
            break;
    }

    // For card badge variant
    if (variant === 'cardBadge') {
        // Get hex color instead of Ant Design's named colors
        const getHexColor = (quality: string): string => {
            switch (quality.toLowerCase()) {
                case MovieQualityEnum._4K:
                    return '#f5222d'; // Red
                case MovieQualityEnum.FHD:
                    return '#52c41a'; // Green
                case MovieQualityEnum.HD:
                    return '#1890ff'; // Blue
                case MovieQualityEnum.SD:
                    return '#13c2c2'; // Cyan
                case MovieQualityEnum.CAM:
                    return '#a0d911'; // Lime
                default:
                    return '#d9d9d9'; // Grey
            }
        };

        const isDark = [MovieQualityEnum._4K, MovieQualityEnum.HD].includes(
            quality.toLowerCase() as MovieQualityEnum,
        );
        const label = quality.toUpperCase();

        const badgeElement = (
            <Tooltip
                title={`Chất lượng: ${label}`}
                placement="top"
                overlayClassName={styles.tooltip}
            >
                <div
                    className={`${styles.cardBadge} ${className}`}
                    style={{
                        backgroundColor: getHexColor(quality),
                        color: isDark ? '#fff' : '#000',
                        ...style,
                    }}
                >
                    {label}
                    {children}
                </div>
            </Tooltip>
        );

        if (withLink && quality) {
            return <Link href={createSearchUrl('quality', quality)}>{badgeElement}</Link>;
        }

        return badgeElement;
    }

    // Default tag styling
    const tagStyles: React.CSSProperties = {
        cursor: withLink ? 'pointer' : 'default',
        borderRadius: '12px',
        fontWeight: 'bold',
        ...style,
    };

    // Add size-specific styles
    if (size === 'small') {
        tagStyles.fontSize = '11px';
        tagStyles.padding = '0 4px';
        tagStyles.lineHeight = '16px';
        tagStyles.height = '18px';
        tagStyles.margin = 0;
    } else if (size === 'large') {
        tagStyles.fontSize = '14px';
        tagStyles.padding = '4px 10px';
    } else {
        tagStyles.padding = '2px 8px';
    }

    const label = quality.toUpperCase();

    const tagElement = (
        <Tooltip title={`Chất lượng: ${label}`} placement="top" overlayClassName={styles.tooltip}>
            <Tag color={color} style={tagStyles} className={className}>
                {label}
                {children}
            </Tag>
        </Tooltip>
    );

    if (withLink && quality) {
        return <Link href={createSearchUrl('quality', quality)}>{tagElement}</Link>;
    }

    return tagElement;
}
