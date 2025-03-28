'use client';

import React from 'react';
import { Button, Dropdown, Avatar, Tooltip } from 'antd';
import { UserOutlined, DownOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useGetIdentity } from '@refinedev/core';
import { signOut } from 'next-auth/react';
import { Grid } from 'antd';

import { RouteNameEnum } from '@/constants/route.constant';
import { getOptimizedImageUrl } from '@/libs/utils/movie.util';
import type { UserDto } from 'apps/api/src/app/users/dtos/user.dto';

const { useBreakpoint } = Grid;

export default function HeaderUser() {
    const pathname = usePathname();
    const router = useRouter();
    const { data: user, isLoading } = useGetIdentity<UserDto>();
    const screens = useBreakpoint();

    if (user && !isLoading) {
        return (
            <Dropdown
                menu={{
                    items: [
                        {
                            key: '1',
                            label: (
                                <Link href={'/nguoi-dung/cap-nhat-thong-tin'}>
                                    Thông tin tài khoản
                                </Link>
                            ),
                        },
                        {
                            key: '2',
                            label: <Link href={'/tu-phim'}>Tủ phim</Link>,
                        },
                        {
                            key: '3',
                            label: (
                                <Link href={'#'} onClick={() => signOut()}>
                                    Đăng xuất
                                </Link>
                            ),
                        },
                    ],
                }}
                trigger={['click']}
            >
                <Button
                    type="text"
                    href={'#'}
                    onClick={(e) => e.preventDefault()}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: screens.md ? '4px 8px' : '2px 4px',
                    }}
                >
                    <Avatar
                        src={
                            user.avatar?.url
                                ? getOptimizedImageUrl(user.avatar?.url, {
                                      width: screens.md ? 32 : 24,
                                      height: screens.md ? 32 : 24,
                                      quality: 30,
                                  })
                                : null
                        }
                        icon={<UserOutlined />}
                        style={{ marginRight: '0.3rem' }}
                        size={screens.md ? 'default' : 'small'}
                    />
                    {screens?.md && <span style={{ marginRight: '0.3rem' }}>{user.fullName}</span>}
                    <DownOutlined style={{ fontSize: screens.md ? 12 : 10 }} />
                </Button>
            </Dropdown>
        );
    }

    return (
        <Tooltip title="Đăng nhập/Đăng kí">
            <Button
                type="default"
                icon={<UserOutlined />}
                onClick={() =>
                    router.push(`${RouteNameEnum.LOGIN_PAGE}?to=${encodeURIComponent(pathname)}`)
                }
                size={screens.md ? 'middle' : 'small'}
                style={{ padding: screens.md ? undefined : '0 8px' }}
            />
        </Tooltip>
    );
}
