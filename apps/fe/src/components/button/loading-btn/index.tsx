import { Button, ButtonProps } from 'antd';
import {
    ReactNode,
    useState,
    MouseEvent as ReactMouseEvent,
    ReactElement,
    PropsWithChildren,
} from 'react';

export type LoadingBtnProps = {
    content?: ReactNode | ReactElement | string;
    isValid?: boolean;
    loading?: boolean;
} & Omit<ButtonProps, 'loading'> &
    PropsWithChildren;

export default function LoadingBtn({
    content,
    onClick,
    isValid,
    children,
    loading: externalLoading,
    ...props
}: LoadingBtnProps) {
    const [internalLoading, setInternalLoading] = useState(false);

    // Use external loading state if provided, otherwise use internal state
    const loading = externalLoading !== undefined ? externalLoading : internalLoading;

    const enterLoading = async (e: ReactMouseEvent<HTMLElement>) => {
        if (isValid && externalLoading === undefined) {
            setInternalLoading(true);
            // Only manage internal loading state if external loading is not provided
            try {
                const minLoadingTimePromise = new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second minimum loading time
                await Promise.all([minLoadingTimePromise]);
            } finally {
                setInternalLoading(false);
            }
        }

        onClick?.(e);
    };

    return (
        <Button loading={loading} onClick={enterLoading} {...props}>
            {content}
            {children}
        </Button>
    );
}
