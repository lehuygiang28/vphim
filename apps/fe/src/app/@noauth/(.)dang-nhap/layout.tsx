import { Metadata } from 'next';
import { PropsWithChildren } from 'react';

export const metadata: Metadata = {
    title: 'Tiếp tục vào VePhim',
    description: 'Tiếp tục vào VePhim',
};

export default function LayoutLoginPage({ children }: PropsWithChildren) {
    return <>{children}</>;
}
