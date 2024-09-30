'use client';

import { useOne } from '@refinedev/core';
import { Form, Input, FormProps, Tooltip, Typography, message } from 'antd';
import { useState, useEffect, useCallback } from 'react';
import { LinkOutlined } from '@ant-design/icons';
import { useDebounce } from 'use-debounce';
import slugify from 'slugify';
import { removeTone, removeDiacritics } from '@vn-utils/text';
import { DocumentNode } from 'graphql';

const { Text } = Typography;

type ResourceType = {
    _id: string;
    name: string;
    slug: string;
};

type ResourceFormProps<T extends ResourceType> = {
    formProps: FormProps;
    type: 'create' | 'edit';
    resource: string;
    gqlQuery: DocumentNode;
    singularName: string;
    operation?: string;
};

export const ResourceForm = <T extends ResourceType>({
    formProps,
    type,
    resource,
    gqlQuery,
    singularName,
    operation,
}: ResourceFormProps<T>) => {
    const [autoSlug, setAutoSlug] = useState(type === 'create');
    const [slug, setSlug] = useState('');
    const [debouncedSlug] = useDebounce(slug, 800);

    const {
        data,
        refetch,
        isRefetching: isCheckingSlugLoading,
    } = useOne<T>({
        dataProviderName: 'graphql',
        resource,
        id: '',
        queryOptions: {
            enabled: false,
        },
        meta: {
            gqlQuery,
            operation: operation || singularName,
            variables: {
                input: { slug: debouncedSlug },
            },
        },
        errorNotification: false,
        successNotification: false,
    });

    const slugExists = !!data?.data;

    const generateSlug = useCallback((name: string) => {
        if (!name) {
            return '';
        }
        return slugify(removeTone(removeDiacritics(name)), {
            lower: true,
            strict: true,
        });
    }, []);

    useEffect(() => {
        if (autoSlug && type === 'create') {
            const name = formProps.form?.getFieldValue('name');
            if (name) {
                const slugged = generateSlug(name);
                setSlug(slugged);
                formProps.form?.setFieldsValue({
                    slug: slugged,
                });
            } else {
                setSlug('');
                formProps.form?.setFieldsValue({
                    slug: '',
                });
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formProps.form?.getFieldValue('name'), autoSlug, generateSlug, type]);

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
                slug: newSlug,
            });
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        formProps.form?.setFieldsValue({
            name: newName,
        });
        if (autoSlug && type === 'create') {
            const slugged = generateSlug(newName);
            setSlug(slugged);
            formProps.form?.setFieldsValue({
                slug: slugged,
            });
        }
    };

    const handleFormSubmit = (values: unknown) => {
        if (type === 'create' && slugExists) {
            message.error(
                `A ${singularName} with this slug already exists. Please choose a different slug.`,
            );
            return;
        }
        return formProps.onFinish?.(values);
    };

    return (
        <Form {...formProps} layout="vertical" onFinish={handleFormSubmit}>
            <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: `Please enter a ${singularName} name` }]}
            >
                <Input onChange={handleNameChange} autoComplete="off" />
            </Form.Item>
            <Form.Item
                name="slug"
                label={
                    <span>
                        Slug
                        {type === 'create' && (
                            <Tooltip title={autoSlug ? 'Disable auto-slug' : 'Enable auto-slug'}>
                                <LinkOutlined
                                    style={{
                                        marginLeft: '8px',
                                        cursor: 'pointer',
                                        color: autoSlug ? '#1890ff' : '#d9d9d9',
                                    }}
                                    onClick={toggleAutoSlug}
                                />
                            </Tooltip>
                        )}
                    </span>
                }
                rules={[
                    { required: true, message: `Please enter a ${singularName} slug` },
                    {
                        pattern: /^[a-zA-Z0-9-_]+$/,
                        message:
                            'Slug can only contain alphanumeric characters, hyphens, and underscores',
                    },
                    {
                        validator: (_, value) => {
                            if (type === 'create' && slugExists) {
                                return Promise.reject('This slug already exists');
                            }
                            return Promise.resolve();
                        },
                    },
                ]}
                help={
                    type === 'create' ? (
                        isCheckingSlugLoading ? (
                            <Text type="secondary">Checking slug availability...</Text>
                        ) : debouncedSlug && slugExists ? (
                            <Text type="danger">This slug already exists</Text>
                        ) : debouncedSlug ? (
                            <Text type="success">Slug is available</Text>
                        ) : null
                    ) : (
                        <Text type="secondary">Slug cannot be changed in edit mode</Text>
                    )
                }
                validateStatus={type === 'create' && slugExists ? 'error' : ''}
            >
                <Input
                    disabled={type === 'edit' || autoSlug}
                    value={slug}
                    onChange={handleSlugChange}
                    readOnly={type === 'edit'}
                />
            </Form.Item>
        </Form>
    );
};
