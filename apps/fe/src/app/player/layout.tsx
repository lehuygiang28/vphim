import { Suspense } from 'react';
import { Skeleton, Layout } from 'antd';
import '@/components/layout/layout.css'; // Import the global layout CSS

const { Content } = Layout;

export default function NoLayout({ children }: { children: React.ReactNode }) {
    return (
        <Layout className="no-header-layout">
            <Content className="no-header-layout">
                <Suspense fallback={<Skeleton />}>{children}</Suspense>
            </Content>
        </Layout>
    );
}
