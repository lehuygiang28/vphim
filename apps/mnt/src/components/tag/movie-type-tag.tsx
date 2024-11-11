import React from 'react';
import { Tag } from 'antd';
import {
    VideoCameraOutlined,
    PlaySquareOutlined,
    PictureOutlined,
    DesktopOutlined,
} from '@ant-design/icons';

import { MovieTypeEnum } from '~api/app/movies/movie.constant';

interface MovieTypeTagProps {
    type: MovieTypeEnum;
}

interface MovieTypeOption {
    value: MovieTypeEnum;
    label: string;
    color: string;
    icon: React.ReactNode;
}

export const movieTypeOptions: MovieTypeOption[] = [
    {
        value: MovieTypeEnum.HOAT_HINH,
        label: 'Animation',
        color: 'magenta',
        icon: <PictureOutlined />,
    },
    {
        value: MovieTypeEnum.TV_SHOWS,
        label: 'TV Shows',
        color: 'blue',
        icon: <DesktopOutlined />,
    },
    {
        value: MovieTypeEnum.SERIES,
        label: 'Series',
        color: 'green',
        icon: <PlaySquareOutlined />,
    },
    {
        value: MovieTypeEnum.SINGLE,
        label: 'Single',
        color: 'orange',
        icon: <VideoCameraOutlined />,
    },
];

const getTagProps = (type: MovieTypeEnum): MovieTypeOption => {
    return (
        movieTypeOptions.find((option) => option.value === type) || {
            value: type,
            label: type,
            color: 'default',
            icon: null,
        }
    );
};

export const MovieTypeTag: React.FC<MovieTypeTagProps> = ({ type }) => {
    const { color, icon, label } = getTagProps(type);

    return (
        <Tag color={color} icon={icon}>
            {label}
        </Tag>
    );
};

export default MovieTypeTag;
