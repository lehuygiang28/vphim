import { PropsWithChildren } from 'react';
import { redirect, RedirectType } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '~fe/app/api/auth/[...nextauth]/options';
import type { UserType } from '~api/app/users/user.type';
import { UserRoleEnum } from '~api/app/users/users.enum';

type AuthWrapperProps = PropsWithChildren<{
    accessType: 'public' | 'authenticated' | 'not-authenticated';
}>;

export async function AuthWrapper({ children, accessType }: AuthWrapperProps) {
    const auth = await getServerSession(authOptions);

    const user = auth?.user as UserType | null;
    const isAuthenticated = !!user;
    const isAdmin = user?.role === UserRoleEnum.Admin;
    const isBlocked = user?.block?.isBlocked;

    if (isBlocked) {
        return redirect('/login?e=blocked', RedirectType.replace);
    }

    switch (accessType) {
        case 'public': {
            return <>{children}</>;
        }

        case 'authenticated': {
            if (!isAuthenticated) {
                return redirect('/login', RedirectType.replace);
            } else if (!isAdmin) {
                return redirect('/login?e=not-admin', RedirectType.replace);
            } else {
                return <>{children}</>;
            }
            break;
        }

        case 'not-authenticated': {
            if (isAuthenticated) {
                // Redirect to the home page if the user is authenticated
                return redirect('/dashboard', RedirectType.replace);
            } else {
                return <>{children}</>;
            }
            break;
        }
        default: {
            return <>{children}</>;
        }
    }

    return <></>;
}
