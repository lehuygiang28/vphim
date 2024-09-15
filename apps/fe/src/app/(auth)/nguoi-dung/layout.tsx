import { Layout } from 'antd';
import { PropsWithChildren } from 'react';

export default function UserPageLayout({ children }: PropsWithChildren) {
    return (
        <Layout
            style={{
                height: '100vh',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            {children}
        </Layout>
    );
}
