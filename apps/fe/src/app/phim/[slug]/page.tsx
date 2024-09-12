'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Movie } from '@/components/pages/movie';

export default function MoviePage() {
    const pathname = usePathname();

    return <Movie slug={pathname?.split('/')?.[pathname?.split('/')?.length - 1] ?? ''} />;
}
