'use client';

import { PropsWithChildren } from 'react';
import { Layout, Grid } from 'antd';

import Header from './header';
import Footer from './footer';

const { Content } = Layout;
const { useBreakpoint } = Grid;

export default function LayoutComp({ children }: PropsWithChildren) {
    const { md } = useBreakpoint();

    return (
        <Layout
            style={{
                overflowX: 'hidden',
            }}
        >
            <Header />
            <Content
                style={{
                    minHeight: '150vh',
                    position: 'relative',
                }}
            >
                {children}
            </Content>

            <div style={{ marginTop: md ? '5rem' : '1.5rem' }}>
                <Footer />
            </div>
        </Layout>
    );
}
