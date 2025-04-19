import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Điều khoản sử dụng',
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
