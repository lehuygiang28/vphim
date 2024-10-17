import { Suspense } from 'react';
import { Skeleton } from 'antd';

export default function NoLayout({ children }: { children: React.ReactNode }) {
    return <Suspense fallback={<Skeleton />}>{children}</Suspense>;
}
