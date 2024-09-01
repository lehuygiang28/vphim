'use client';

import { Suspense } from 'react';

import { Home } from '@/components/pages/home';

export default function IndexPage() {
    return (
        <Suspense>
            <Home />
        </Suspense>
    );
}
