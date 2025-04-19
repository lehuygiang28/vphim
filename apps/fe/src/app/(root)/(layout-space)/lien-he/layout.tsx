import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Liên hệ',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
