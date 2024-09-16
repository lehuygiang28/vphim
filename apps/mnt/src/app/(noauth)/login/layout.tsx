import { Metadata } from 'next';
import { PropsWithChildren } from 'react';

export const metadata: Metadata = {
    title: 'Login - VePhim',
    description: 'Login - VePhim',
};

export default function LayoutLoginPage({ children }: PropsWithChildren) {
    return <>{children}</>;
}
