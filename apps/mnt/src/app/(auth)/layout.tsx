import { PropsWithChildren } from 'react';

import { ThemedLayout } from '~mnt/components/themed-layout';
import { AuthWrapper } from '~mnt/components/auth-layout/wrapper';

export default function AdminLayout({ children }: PropsWithChildren) {
    return (
        <AuthWrapper accessType="authenticated">
            <ThemedLayout>{children}</ThemedLayout>
        </AuthWrapper>
    );
}
