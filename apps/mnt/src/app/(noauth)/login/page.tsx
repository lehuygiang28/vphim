'use client';

import { Layout } from 'antd';
import Login from '~fe/components/pages/auth/login';

export default function LoginPage() {
    return (
        <Layout
            style={{
                height: '100vh',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <Login redirectTo="/login" lang="en" />
        </Layout>
    );
}
