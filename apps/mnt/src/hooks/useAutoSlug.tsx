import { useState, useEffect, useCallback } from 'react';
import { FormProps, message } from 'antd';
import { useDebounce } from 'use-debounce';
import slugify from 'slugify';
import { removeTone, removeDiacritics } from '@vn-utils/text';
import { useOne } from '@refinedev/core';
import { DocumentNode } from 'graphql';

export interface UseAutoSlugProps {
    formProps: FormProps;
    type: 'create' | 'edit';
    gqlQuery: DocumentNode;
    operation: 'category' | 'actor' | 'region' | 'director';
    slugField?: string;
    sourceField?: string;
}

export const useAutoSlug = ({
    formProps,
    type,
    gqlQuery,
    operation,
    slugField = 'slug',
    sourceField = 'name',
}: UseAutoSlugProps) => {
    const [autoSlug, setAutoSlug] = useState(type === 'create');
    const [slug, setSlug] = useState('');
    const [debouncedSlug] = useDebounce(slug, 800);

    const {
        data,
        refetch,
        isRefetching: isCheckingSlugLoading,
    } = useOne({
        dataProviderName: 'graphql',
        resource: 'categories',
        id: '',
        queryOptions: {
            enabled: false,
            retry: false,
        },
        meta: {
            gqlQuery: gqlQuery,
            operation: operation,
            variables: {
                input: { slug: debouncedSlug },
            },
        },
        errorNotification: false,
        successNotification: false,
    });

    const slugExists = !!data?.data;

    const generateSlug = useCallback((inputString: string) => {
        if (!inputString) {
            return '';
        }
        return slugify(removeTone(removeDiacritics(inputString)), {
            lower: true,
            strict: true,
        });
    }, []);

    useEffect(() => {
        if (autoSlug && type === 'create') {
            const sourceFieldValue = formProps.form?.getFieldValue(sourceField);
            if (sourceFieldValue) {
                const slugged = generateSlug(sourceFieldValue);
                setSlug(slugged);
                formProps.form?.setFieldsValue({
                    [slugField]: slugged,
                });
            } else {
                setSlug('');
                formProps.form?.setFieldsValue({
                    [slugField]: '',
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formProps.form?.getFieldValue(sourceField), autoSlug, generateSlug, type]);

    useEffect(() => {
        if (debouncedSlug && type === 'create') {
            refetch();
        }
    }, [debouncedSlug, refetch, type]);

    const toggleAutoSlug = () => {
        if (type === 'create') {
            setAutoSlug(!autoSlug);
        }
    };

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (type === 'create') {
            const newSlug = e.target.value;
            setSlug(newSlug);
            formProps.form?.setFieldsValue({
                [slugField]: newSlug,
            });
        }
    };

    const handleSourceFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        formProps.form?.setFieldsValue({
            [sourceField]: newName,
        });
        if (autoSlug && type === 'create') {
            const slugged = generateSlug(newName);
            setSlug(slugged);
            formProps.form?.setFieldsValue({
                [slugField]: slugged,
            });
        }
    };

    const handleFormSubmit = (values: unknown) => {
        if (type === 'create' && slugExists) {
            message.error(
                `A ${operation} with this slug already exists. Please choose a different slug.`,
            );
            return;
        }
        return formProps.onFinish?.(values);
    };

    return {
        slug,
        autoSlug,
        isCheckingSlugLoading,
        slugExists,
        toggleAutoSlug,
        handleSlugChange,
        handleSourceFieldChange,
        handleFormSubmit,
    };
};
