import { useEffect } from 'react';
import { Button } from 'antd';
import { FormInstance } from 'antd/lib/form';
import { ClearOutlined } from '@ant-design/icons';
import { CreateResponse, UpdateResponse } from '@refinedev/core';

export type UseFormLocalStorageProps<T> = {
    form: FormInstance<T>;
    storageKey: string;
    onFinish: (values: T) => Promise<void | UpdateResponse<T> | Promise<CreateResponse<T>>>;
};

export type UseFormLocalStorage<T> = {
    handleValuesChange: (changedValues: Partial<T>, allValues: T) => void;
    handleFormFinish: (values: T) => Promise<void>;
    clearStoredFormData: () => void;
    clearButtonProps: {
        onClick: () => void;
        'data-testid': string;
    };
    ClearFormButton: React.FC;
};

export function useFormLocalStorage<T>(props: UseFormLocalStorageProps<T>): UseFormLocalStorage<T> {
    const { form, onFinish, storageKey } = props;

    useEffect(() => {
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                form.setFieldsValue(parsedData);
            } catch (error) {
                console.error(`Error parsing saved data for ${storageKey}:`, error);
            }
        }
    }, [form, storageKey]);

    const handleValuesChange = (changedValues: Partial<T>, allValues: T) => {
        localStorage.setItem(storageKey, JSON.stringify(allValues));
    };

    const clearStoredFormData = () => {
        localStorage.removeItem(storageKey);
        form.resetFields();
    };

    const handleFormFinish = async (values: T) => {
        try {
            await onFinish(values);
            localStorage.removeItem(storageKey);
        } catch (error) {
            console.error('Error creating movie:', error);
        }
    };

    const clearButtonProps = {
        onClick: clearStoredFormData,
        'data-testid': `clear-${storageKey}-form`,
    };

    const ClearFormButton: React.FC = () => (
        <Button icon={<ClearOutlined />} {...clearButtonProps}>
            Xóa dữ liệu
        </Button>
    );

    return {
        handleValuesChange,
        handleFormFinish,
        clearStoredFormData,
        clearButtonProps,
        ClearFormButton,
    };
}
