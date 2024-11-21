'use client';

import React, { Fragment, PropsWithChildren, useContext } from 'react';
import Image from 'next/image';
// import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Typography, Avatar, Dropdown, Layout } from 'antd';
import { ItemType } from 'antd/es/menu/interface';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useLogout, useGetIdentity } from '@refinedev/core';
import { ThemedLayoutV2, ThemedSiderV2 } from '@refinedev/antd';

import { type UserType } from '~api/app/users/user.type';
import { ColorModeContext } from '~fe/contexts/color-mode';

const { Text, Link } = Typography;

function CustomSider() {
    const router = useRouter();
    const { data: user } = useGetIdentity<UserType>();
    const { mutate: logout } = useLogout();

    const userMenu: ItemType[] = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: <Link onClick={() => router.push('/profile')}>Profile</Link>,
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Logout',
            onClick: () => logout(),
        },
    ];

    return (
        <ThemedSiderV2
            Title={() => (
                <Link href={'/'} style={{ all: 'unset', cursor: 'pointer' }}>
                    <Image
                        src={'/assets/images/logo-mini.png'}
                        alt="logo vephim"
                        width={70}
                        height={20}
                    />
                </Link>
            )}
            render={({ items, collapsed }) => {
                return (
                    <>
                        {items.map((item, index) => (
                            <Fragment key={`${item.key}_${index}`}>{item}</Fragment>
                        ))}
                        <div
                            style={{
                                padding: collapsed ? '0.5rem' : '1rem',
                                borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                                marginTop: 'auto',
                            }}
                        >
                            <Dropdown
                                menu={{ items: userMenu }}
                                trigger={['click']}
                                placement="topRight"
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        maxWidth: '100%',
                                    }}
                                >
                                    <Avatar
                                        src={user?.avatar.url}
                                        icon={<UserOutlined />}
                                        size={collapsed ? 'default' : 'large'}
                                        style={{ marginRight: collapsed ? 0 : '0.5rem' }}
                                    />
                                    {!collapsed && (
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                minWidth: 0,
                                                maxWidth: '100%',
                                            }}
                                        >
                                            <Text
                                                strong
                                                style={{
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}
                                            >
                                                {user?.fullName}
                                            </Text>
                                            <Text
                                                type="secondary"
                                                style={{
                                                    fontSize: '0.8rem',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}
                                            >
                                                {user?.email}
                                            </Text>
                                        </div>
                                    )}
                                </div>
                            </Dropdown>
                        </div>
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

    return (
        <ThemedLayoutV2 Sider={() => <CustomSider />} Footer={() => <CustomFooter mode={mode} />}>
            {children}
        </ThemedLayoutV2>
    );
}
