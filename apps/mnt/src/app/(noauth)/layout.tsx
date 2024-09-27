import { PropsWithChildren } from 'react';
import { AuthWrapper } from '~mnt/components/auth-layout/wrapper';

export default function NoAuthLayout({ children }: PropsWithChildren) {
    return <AuthWrapper accessType="not-authenticated">{children}</AuthWrapper>;
}
