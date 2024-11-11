import React from 'react';
import { Tag } from 'antd';
import {
    CheckCircleOutlined,
    SyncOutlined,
    PlayCircleOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';

import { MovieStatusEnum } from '~api/app/movies/movie.constant';

interface MovieStatusTagProps {
    status: MovieStatusEnum;
}

interface MovieStatusOption {
    value: MovieStatusEnum;
    label: string;
    color: string;
    icon: React.ReactNode;
}

export const movieStatusOptions: MovieStatusOption[] = [
    {
        value: MovieStatusEnum.TRAILER,
        label: 'Trailer',
        color: 'warning',
        icon: <PlayCircleOutlined />,
    },
    {
        value: MovieStatusEnum.COMPLETED,
        label: 'Completed',
        color: 'success',
        icon: <CheckCircleOutlined />,
    },
    {
        value: MovieStatusEnum.ON_GOING,
        label: 'Ongoing',
        color: 'processing',
        icon: <SyncOutlined spin />,
    },
    {
        value: MovieStatusEnum.UPDATING,
        label: 'Updating',
        color: 'cyan',
        icon: <ClockCircleOutlined />,
    },
];

const getTagProps = (status: MovieStatusEnum): MovieStatusOption => {
    return (
        movieStatusOptions.find((option) => option.value === status) || {
            value: status,
            label: status,
            color: 'default',
            icon: null,
        }
    );
};

export const MovieStatusTag: React.FC<MovieStatusTagProps> = ({ status }) => {
    const { color, icon, label } = getTagProps(status);

    return (
        <Tag color={color} icon={icon}>
            {label}
        </Tag>
    );
};

export default MovieStatusTag;
