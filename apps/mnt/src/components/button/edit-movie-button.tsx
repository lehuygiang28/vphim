'use client';

import Link from 'next/link';
import { Button } from 'antd';
import { EditOutlined } from '@ant-design/icons';

export type EditMovieButtonProps = {
    id: string;
    hideText?: boolean;
    size?: 'small' | 'middle' | 'large';
};

export function EditMovieButton({ id, hideText = false, size = 'middle' }: EditMovieButtonProps) {
    return (
        <Link href={`/movies/edit/${id}?r=${new Date().getTime()?.toString()?.slice(-4)}`}>
            <Button type="default" icon={<EditOutlined />} size={size}>
                {!hideText && 'Edit'}
            </Button>
        </Link>
    );
}
