import { Suspense } from 'react';
import dynamic from 'next/dynamic';

import { LoadingSpinner } from '@/components/loading';

const Home = dynamic(() => import('@/components/pages/home'), { ssr: true });

export default function IndexPage() {
    return (
        <Suspense fallback={<LoadingSpinner fullScreen />}>
            <Home />
        </Suspense>
    );
}
