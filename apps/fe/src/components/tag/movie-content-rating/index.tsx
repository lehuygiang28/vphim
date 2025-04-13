import React from 'react';
import { Tag, Tooltip } from 'antd';
import Link from 'next/link';
import { MovieContentRatingEnum } from 'apps/api/src/app/movies/movie.constant';
import { RouteNameEnum } from '@/constants/route.constant';
import { stringifyTableParams } from '@/libs/utils/url.util';
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
            return 'green'; // Light green - kids with parent guidance
        case MovieContentRatingEnum.T13:
            return 'blue'; // Blue - teens 13+
        case MovieContentRatingEnum.T16:
            return 'orange'; // Orange - teens 16+
        case MovieContentRatingEnum.T18:
            return 'volcano'; // Darker orange/red - adults only
        case MovieContentRatingEnum.C:
            return 'red'; // Red - not allowed to be distributed
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
            return 'T13+ - Trên 13 tuổi';
        case MovieContentRatingEnum.T16:
            return 'T16+ - Trên 16 tuổi';
        case MovieContentRatingEnum.T18:
            return 'T18+ - Trên 18 tuổi';
        case MovieContentRatingEnum.C:
            return 'C - Cấm phổ biến';
        default:
            return rating as string;
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

const createSearchUrl = (rating: string) => {
    return `${RouteNameEnum.MOVIE_LIST_PAGE}?${stringifyTableParams({
        filters: [{ field: 'contentRating', value: rating, operator: 'eq' }],
        sorters: [],
    })}`;
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
    const label = showLabel ? getContentRatingLabel(rating) : rating;
    const description = getContentRatingDescription(rating);

    // If it's a card badge, use different styling
    if (variant === 'cardBadge') {
        // For card badges, get hex color instead of Ant Design's named colors
        const getHexColor = (rating: string): string => {
            switch (rating) {
                case MovieContentRatingEnum.P:
                    return '#52c41a'; // Green
                case MovieContentRatingEnum.K:
                    return '#73d13d'; // Light green
                case MovieContentRatingEnum.T13:
                    return '#1890ff'; // Blue
                case MovieContentRatingEnum.T16:
                    return '#fa8c16'; // Orange
                case MovieContentRatingEnum.T18:
                    return '#fa541c'; // Darker orange
                case MovieContentRatingEnum.C:
                    return '#f5222d'; // Red
                default:
                    return '#d9d9d9'; // Grey
            }
        };

        const isDark = [
            MovieContentRatingEnum.T13,
            MovieContentRatingEnum.T16,
            MovieContentRatingEnum.T18,
            MovieContentRatingEnum.C,
        ].includes(rating as MovieContentRatingEnum);

        const badgeElement = (
            <Tooltip title={description} placement="top" overlayClassName={styles.tooltip}>
                <div
                    className={`${styles.cardBadge} ${className}`}
                    style={{
                        backgroundColor: getHexColor(rating as string),
                        color: isDark ? '#fff' : '#000',
                        ...style,
                    }}
                >
                    {label}
                </div>
            </Tooltip>
        );

        if (withLink && rating) {
            return <Link href={createSearchUrl(rating as string)}>{badgeElement}</Link>;
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

    const ratingTag = (
        <Tooltip title={description} placement="top" overlayClassName={styles.tooltip}>
            <Tag color={color} style={tagStyles} className={className}>
                {label}
            </Tag>
        </Tooltip>
    );

    if (withLink && rating) {
        return <Link href={createSearchUrl(rating as string)}>{ratingTag}</Link>;
    }

    return ratingTag;
};
