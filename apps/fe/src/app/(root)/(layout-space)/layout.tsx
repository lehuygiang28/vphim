'use client';

import { PropsWithChildren } from 'react';
import '@/components/layout/layout.css';

export default function MovieLayout({ children }: PropsWithChildren) {
    return <div className="layout-space-container">{children}</div>;
}
