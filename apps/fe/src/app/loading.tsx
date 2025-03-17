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
                backgroundColor: 'var(--vphim-color-bg-base, #141414)',
            }}
        >
            <Spin
                size="large"
                indicator={<LoadingOutlined spin style={{ fontSize: 36 }} />}
                tip="Loading..."
                style={{
                    color: 'var(--vphim-color-primary, #E50914)',
                }}
            />
        </div>
    );
};

export default Loading;
