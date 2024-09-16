'use client';

import React, { useContext } from 'react';
import type { RefineThemedLayoutV2HeaderProps } from '@refinedev/antd';
import { Avatar, Layout, Space, Switch, theme, Typography, Grid } from 'antd';

import { ColorModeContext } from '~fe/contexts/color-mode';
import { type UserType } from '~api/app/users/user.type';

const { Text } = Typography;
const { useToken } = theme;
const { useBreakpoint } = Grid;
const { Header: HeaderAntd } = Layout;

export type HeaderProps = RefineThemedLayoutV2HeaderProps & {
    user: UserType;
};

export function Header({ sticky, user }: HeaderProps) {
    const { token } = useToken();
    const screens = useBreakpoint();
    const { mode, setMode } = useContext(ColorModeContext);

    const headerStyles: React.CSSProperties = {
        backgroundColor: token.colorBgElevated,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: '0px 24px',
        height: '64px',
    };

    if (sticky) {
        headerStyles.position = 'sticky';
        headerStyles.top = 0;
        headerStyles.zIndex = 1;
    }

    return (
        <HeaderAntd style={headerStyles}>
            <Space>
                <Switch
                    checkedChildren="🌛"
                    unCheckedChildren="🔆"
                    onChange={() => setMode(mode === 'light' ? 'dark' : 'light')}
                    defaultChecked={mode === 'dark'}
                />
                {user && (
                    <Space style={{ marginLeft: '8px' }} size="middle">
                        {screens?.md && <Text strong>{user.email}</Text>}
                        <Avatar src={user?.avatar?.url} alt={`avatar of ${user?.email}`} />
                    </Space>
                )}
            </Space>
        </HeaderAntd>
    );
}
