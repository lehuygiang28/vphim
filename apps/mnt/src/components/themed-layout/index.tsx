'use client';

import React, { Fragment, PropsWithChildren, useContext } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Layout, Typography } from 'antd';
import { useGetIdentity } from '@refinedev/core';
import { ThemedLayoutV2, ThemedSiderV2 } from '@refinedev/antd';

import { ColorModeContext } from '~fe/contexts/color-mode';
import { type UserType } from '~api/app/users/user.type';

const { Text } = Typography;

function CustomSider({ mode, user }: { mode: string; user: UserType }) {
    return (
        <ThemedSiderV2
            Title={() => (
                <>
                    <Link href={'/'} style={{ all: 'unset', cursor: 'pointer' }}>
                        <Image
                            src={'/assets/images/logo-mini.png'}
                            alt="logo vephim"
                            width={70}
                            height={20}
                        />
                    </Link>
                </>
            )}
            render={({ items, logout, collapsed }) => {
                return (
                    <>
                        {items.map((item, index) => {
                            return <Fragment key={`${item.key}_${index}`}>{item}</Fragment>;
                        })}
                        {logout}
                        {collapsed}
                    </>
                );
            }}
        />
    );
}

function CustomFooter({ mode }: { mode: string }) {
    return (
        <Layout.Footer
            style={{
                textAlign: 'center',
                color: mode === 'dark' ? '#fff' : '#000',
            }}
        >
            <Text type="secondary">
                VePhim ©{new Date().getFullYear()} Made with ❤️ by{' '}
                <Link target="_blank" href="https://github.com/lehuygiang28">
                    lehuygiang28
                </Link>
            </Text>
        </Layout.Footer>
    );
}

export function ThemedLayout({ children }: PropsWithChildren) {
    const { mode } = useContext(ColorModeContext);
    const { data: user } = useGetIdentity<UserType>();

    return (
        <ThemedLayoutV2
            Sider={() => <CustomSider mode={mode} user={user} />}
            Footer={() => <CustomFooter mode={mode} />}
        >
            {children}
        </ThemedLayoutV2>
    );
}
