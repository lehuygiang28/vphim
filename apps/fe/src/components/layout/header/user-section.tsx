'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Input, Button, Drawer, Grid, Avatar, Dropdown } from 'antd';
import { SearchOutlined, UserOutlined, MenuOutlined, DownOutlined } from '@ant-design/icons';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { stringifyTableParams, useGetIdentity, useLogout } from '@refinedev/core';
import { UserDto } from 'apps/api/src/app/users/dtos';

const { Header } = Layout;
const { useBreakpoint } = Grid;

export default function HeaderCom({ categoryMenu = [], regionMenu = [] }) {
  const [scrolled, setScrolled] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const screens = useBreakpoint();
  const [searchValue, setSearchValue] = useState('');
  const router = useRouter();
  const { data: user } = useGetIdentity<UserDto>();
  const { mutate: logout } = useLogout();

  // ... (keep the existing useEffect, showDrawer, onCloseDrawer, toggleSearch, and handleSearch functions)

  const userMenu = (
    <Menu>
      <Menu.Item key="1">User Info</Menu.Item>
      <Menu.Item key="2">Favorites</Menu.Item>
      <Menu.Item key="3">Change Password</Menu.Item>
      <Menu.Item key="4" onClick={() => logout()}>Logout</Menu.Item>
    </Menu>
  );

}
