'use client';

import { Grid } from 'antd';
import { PropsWithChildren } from 'react';
import '@/components/layout/layout.css'; // Import global layout CSS

const { useBreakpoint } = Grid;

export default function MovieLayout({ children }: PropsWithChildren) {
    const { md } = useBreakpoint();

    return (
        <div
            className="layout-space-container"
            style={{
                marginLeft: md ? '3rem' : '0.7rem',
                marginRight: md ? '3rem' : '0.7rem',
                paddingBottom: '2rem',
                position: 'relative',
                zIndex: 1,
            }}
        >
            {children}
        </div>
    );
}
