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
    // Get modern colors for different quality types
    switch (quality.toLowerCase()) {
        case MovieQualityEnum._4K:
            color = 'magenta';
            break;
        case MovieQualityEnum.FHD:
            color = 'success';
            break;
        case MovieQualityEnum.HD:
            color = 'processing';
            break;
        case MovieQualityEnum.SD:
            color = 'cyan';
            break;
        case MovieQualityEnum.CAM:
            color = 'warning';
            break;
        default:
            color = 'default';
            break;
    }

    // For card badge variant
    if (variant === 'cardBadge') {
        // Get CSS class for gradient styling based on quality
        const getQualityClass = (quality: string): string => {
            switch (quality.toLowerCase()) {
                case MovieQualityEnum._4K:
                    return styles.quality4K;
                case MovieQualityEnum.FHD:
                    return styles.qualityFHD;
                case MovieQualityEnum.HD:
                    return styles.qualityHD;
                case MovieQualityEnum.SD:
                    return styles.qualitySD;
                case MovieQualityEnum.CAM:
                    return styles.qualityCAM;
                default:
                    return '';
            }
        };

        const qualityClass = getQualityClass(quality);
        const label = quality.toUpperCase();

        const badgeElement = (
            <Tooltip
                title={`Chất lượng: ${label}`}
                placement="top"
                overlayClassName={styles.tooltip}
            >
                <div className={`${styles.cardBadge} ${qualityClass} ${className}`} style={style}>
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
        borderRadius: '16px',
        fontWeight: 600,
        transition: 'all 0.2s ease',
        border: 'none',
        boxShadow: '0 2px 0 rgba(0,0,0,0.02)',
        ...style,
    };

    // Add size-specific styles
    if (size === 'small') {
        tagStyles.fontSize = '12px';
        tagStyles.padding = '0 6px';
        tagStyles.lineHeight = '18px';
        tagStyles.height = '20px';
        tagStyles.margin = 0;
    } else if (size === 'large') {
        tagStyles.fontSize = '14px';
        tagStyles.padding = '5px 12px';
    } else {
        tagStyles.padding = '3px 10px';
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
