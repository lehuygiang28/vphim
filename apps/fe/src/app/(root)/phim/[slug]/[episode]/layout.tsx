'use client';

import { Grid } from 'antd';
import { PropsWithChildren } from 'react';

const { useBreakpoint } = Grid;

export default function MovieLayout({ children }: PropsWithChildren) {
    const { md } = useBreakpoint();

    return (
        <div
            style={{
                marginTop: md ? '6rem' : '5rem',
                marginLeft: md ? '3rem' : '0.5rem',
                marginRight: md ? '3rem' : '0.5rem',
            }}
        >
            {children}
        </div>
    );
}
