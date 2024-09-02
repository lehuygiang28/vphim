import { Tag } from 'antd';
import React, { CSSProperties, PropsWithChildren } from 'react';

export type MovieQualityTagProps = {
    quality: string;
    style?: CSSProperties;
} & PropsWithChildren;

export function MovieQualityTag({ quality, style, children }: MovieQualityTagProps) {
    let color;

    switch (quality.toUpperCase()) {
        case 'HD':
        case 'FHD':
            color = 'green';
            break;
        case 'SD':
            color = 'blue';
            break;
        case '4K':
            color = 'red';
            break;
        case 'CAM':
            color = 'orange';
            break;
        default:
            color = 'gray';
            break;
    }

    return (
        <Tag color={color} style={style}>
            {quality.toUpperCase()}
            {children}
        </Tag>
    );
}
