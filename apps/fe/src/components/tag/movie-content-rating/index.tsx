import React from 'react';
import { Tag, Tooltip } from 'antd';
import Link from 'next/link';
import { MovieContentRatingEnum } from 'apps/api/src/app/movies/movie.constant';
import { createSearchUrl } from '@/libs/utils/url.util';
import styles from './movie-content-rating.module.css';

type MovieContentRatingProps = {
    rating?: MovieContentRatingEnum | string;
    showLabel?: boolean;
    size?: 'small' | 'middle' | 'large';
    withLink?: boolean;
    style?: React.CSSProperties;
    variant?: 'tag' | 'cardBadge';
    className?: string;
};

export const getContentRatingColor = (rating?: MovieContentRatingEnum | string): string => {
    if (!rating) return 'default';

    switch (rating) {
        case MovieContentRatingEnum.P:
            return 'success'; // Green - suitable for everyone
        case MovieContentRatingEnum.K:
            return 'lime'; // Lime - kids with parent guidance
        case MovieContentRatingEnum.T13:
            return 'geekblue'; // Geekblue - teens 13+
        case MovieContentRatingEnum.T16:
            return 'gold'; // Gold - teens 16+
        case MovieContentRatingEnum.T18:
            return 'orange'; // Orange - adults only
        case MovieContentRatingEnum.C:
            return 'volcano'; // Volcano - not allowed to be distributed
        default:
            return 'default';
    }
};

export const getContentRatingLabel = (rating?: MovieContentRatingEnum | string): string => {
    if (!rating) return 'N/A';

    switch (rating) {
        case MovieContentRatingEnum.P:
            return 'P - Phổ biến rộng rãi';
        case MovieContentRatingEnum.K:
            return 'K - Khuyến cáo có người hướng dẫn';
        case MovieContentRatingEnum.T13:
            return 'T13 - Trên 13 tuổi';
        case MovieContentRatingEnum.T16:
            return 'T16 - Trên 16 tuổi';
        case MovieContentRatingEnum.T18:
            return 'T18 - Trên 18 tuổi';
        case MovieContentRatingEnum.C:
            return 'C - Cấm phổ biến';
        default:
            return String(rating).toUpperCase();
    }
};

export const getContentRatingDescription = (rating?: MovieContentRatingEnum | string): string => {
    if (!rating) return '';

    switch (rating) {
        case MovieContentRatingEnum.P:
            return 'Phim không có hạn chế độ tuổi, phù hợp để phổ biến đến mọi đối tượng khán giả. Nội dung được xây dựng sao cho mang tính chất giáo dục và giải trí phổ quát.';
        case MovieContentRatingEnum.K:
            return 'Phim được chiếu đến người xem dưới 13 tuổi, với điều kiện là phải có sự hướng dẫn hoặc sự giám sát từ phía cha, mẹ hoặc người giám hộ.';
        case MovieContentRatingEnum.T13:
            return 'Phim phù hợp cho đối tượng từ 13 tuổi trở lên. Những tác phẩm này có thể chứa những yếu tố nội dung phức tạp hơn, phù hợp với sự hiểu biết và trí tuệ của khán giả trong độ tuổi này.';
        case MovieContentRatingEnum.T16:
            return 'Phim được phổ biến đến người xem từ 16 tuổi trở lên. Nội dung có thể chứa các yếu tố phức tạp hơn, thách thức trí tuệ và sự hiểu biết của đối tượng khán giả này.';
        case MovieContentRatingEnum.T18:
            return 'Phim dành cho người xem từ 18 tuổi trở lên. Đây là những tác phẩm có nội dung chủ yếu dành cho đối tượng người lớn, có thể chứa những yếu tố nội dung nhạy cảm.';
        case MovieContentRatingEnum.C:
            return 'Phim không được phép phổ biến, có nghĩa là nội dung không đáp ứng được các tiêu chí quy định và không phù hợp để đưa ra công chúng.';
        default:
            return '';
    }
};

export const MovieContentRating: React.FC<MovieContentRatingProps> = ({
    rating,
    showLabel = false,
    size = 'middle',
    withLink = true,
    style = {},
    variant = 'tag',
    className = '',
}) => {
    if (!rating) return null;

    const color = getContentRatingColor(rating);
    const label = showLabel
        ? getContentRatingLabel(rating)
        : typeof rating === 'string'
        ? rating.toUpperCase()
        : rating;
    const description = getContentRatingDescription(rating);

    // If it's a card badge, use different styling
    if (variant === 'cardBadge') {
        // Get CSS class for gradient styling based on rating
        const getRatingClass = (rating: MovieContentRatingEnum | string): string => {
            switch (rating) {
                case MovieContentRatingEnum.P:
                    return styles.ratingP;
                case MovieContentRatingEnum.K:
                    return styles.ratingK;
                case MovieContentRatingEnum.T13:
                    return styles.ratingT13;
                case MovieContentRatingEnum.T16:
                    return styles.ratingT16;
                case MovieContentRatingEnum.T18:
                    return styles.ratingT18;
                case MovieContentRatingEnum.C:
                    return styles.ratingC;
                default:
                    return '';
            }
        };

        const ratingClass = getRatingClass(rating);

        const badgeElement = (
            <Tooltip title={description} placement="top" overlayClassName={styles.tooltip}>
                <div className={`${styles.cardBadge} ${ratingClass} ${className}`} style={style}>
                    {label}
                </div>
            </Tooltip>
        );

        if (withLink && rating) {
            return (
                <Link href={createSearchUrl('contentRating', rating.toString())}>
                    {badgeElement}
                </Link>
            );
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

    const ratingTag = (
        <Tooltip title={description} placement="top" overlayClassName={styles.tooltip}>
            <Tag color={color} style={tagStyles} className={className}>
                {label}
            </Tag>
        </Tooltip>
    );

    if (withLink && rating) {
        return <Link href={createSearchUrl('contentRating', rating.toString())}>{ratingTag}</Link>;
    }

    return ratingTag;
};
