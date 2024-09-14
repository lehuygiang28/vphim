'use client';

import { Suspense } from 'react';

import { Home } from '@/components/pages/home';
import Loading from '../loading';

export default function IndexPage() {
    return (
        <Suspense fallback={<Loading />}>
            <Home />
        </Suspense>
    );
}
