import { Metadata } from 'next';
import { PropsWithChildren } from 'react';

export const metadata: Metadata = {
    title: 'Đăng nhập - VePhim',
    description: 'Đăng nhập vào tài khoản VePhim của bạn',
};

export default function LayoutLoginPage({ children }: PropsWithChildren) {
    return <>{children}</>;
}
