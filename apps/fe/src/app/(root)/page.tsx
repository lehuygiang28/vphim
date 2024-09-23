import { LoadingSpinner } from '@/components/loading';
import { Home } from '@/components/pages/home';
import { Suspense } from 'react';

export default function IndexPage() {
    return (
        <Suspense fallback={<LoadingSpinner fullScreen/>}>
            <Home />
        </Suspense>
    );
}
