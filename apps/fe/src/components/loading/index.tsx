import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface LoadingSpinnerProps {
    fullScreen?: boolean;
    size?: 'small' | 'default' | 'large';
    tip?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    fullScreen = false,
    size = 'large',
    tip = 'Loading...',
}) => {
    const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

    const spinnerElement = <Spin indicator={antIcon} size={size} tip={tip} />;

    if (fullScreen) {
        return (
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 9999,
                }}
            >
                {spinnerElement}
            </div>
        );
    }

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                width: '100%',
            }}
        >
            {spinnerElement}
        </div>
    );
};
