import React, { CSSProperties, PropsWithChildren } from 'react';
import { Tag, TagProps } from 'antd';

import { MovieQualityEnum } from 'apps/api/src/app/movies/movie.constant';

export type MovieQualityTagProps = {
    quality: string;
    style?: CSSProperties;
} & PropsWithChildren;

export function MovieQualityTag({ quality, style, children }: MovieQualityTagProps) {
    let color: TagProps['color'] = 'gray';

    switch (quality.toLowerCase()) {
        case MovieQualityEnum._4K:
            color = 'red';
            break;
        case MovieQualityEnum.FHD:
            color = 'green';
            break;
        case MovieQualityEnum.HD:
            color = 'red';
            break;
        case MovieQualityEnum.SD:
            color = 'cyan';
            break;
        case MovieQualityEnum.CAM:
            color = 'lime';
            break;
        default:
            color = 'gray';
            break;
    }

    return (
        <Tag color={color} style={style}>
            {quality.toUpperCase() || 'N/A'}
            {children}
        </Tag>
    );
}
