import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const Loading = () => {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                width: '100vw',
                backgroundColor: '#000',
            }}
        >
            <Spin size="large" indicator={<LoadingOutlined spin />} tip="Đang tải..." />
        </div>
    );
};

export default Loading;
