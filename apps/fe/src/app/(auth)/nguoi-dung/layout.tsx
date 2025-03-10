import { Layout } from 'antd';
import { PropsWithChildren } from 'react';
import '@/components/layout/layout.css'; // Import the global layout CSS

export default function UserPageLayout({ children }: PropsWithChildren) {
    return (
        <Layout
            className="auth-layout"
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
