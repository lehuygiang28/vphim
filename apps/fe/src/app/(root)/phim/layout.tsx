'use client';

import { Grid } from 'antd';
import { PropsWithChildren } from 'react';

const { useBreakpoint } = Grid;

export default function MovieLayout({ children }: PropsWithChildren) {
    const { md } = useBreakpoint();

    return (
        <div
            style={{
                marginTop: md ? '6rem' : '1.5rem',
                marginLeft: md ? '3rem' : '1rem',
                marginRight: md ? '3rem' : '1rem',
            }}
        >
            {children}
        </div>
    );
}
