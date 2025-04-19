import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Về chúng tôi',
};

export default function AboutUsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
