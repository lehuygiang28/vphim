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
} & Omit<ButtonProps, 'loading'> &
    PropsWithChildren;

export default function LoadingBtn({
    content,
    onClick,
    isValid,
    children,
    ...props
}: LoadingBtnProps) {
    const [loading, setLoading] = useState(false);

    const enterLoading = async (e: ReactMouseEvent<HTMLElement>) => {
        if (isValid) {
            setLoading(true);
            const minLoadingTimePromise = new Promise((resolve) => setTimeout(resolve, 3000)); // 3 second minimum loading time
            await Promise.all([minLoadingTimePromise]);
            setLoading(false);
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
