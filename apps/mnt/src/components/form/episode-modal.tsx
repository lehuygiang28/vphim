'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Space, Tooltip } from 'antd';
import { PlusOutlined, MinusCircleOutlined, LinkOutlined } from '@ant-design/icons';
import slugifyCore from 'slugify';
import { removeTone, removeDiacritics } from '@vn-utils/text';

const slugify = (text: string) => {
    return slugifyCore(removeDiacritics(removeTone(text)), {
        lower: true,
    });
};

const isValidUrl = (url: string) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

export const EpisodeModal = ({ visible, onClose, form, serverIndex, serverName }) => {
    const [episodeForm] = Form.useForm();
    const [autoSlugify, setAutoSlugify] = useState<{ [key: number]: boolean }>({});

    useEffect(() => {
        if (visible) {
            episodeForm.resetFields();
            setAutoSlugify({});
        }
    }, [visible, episodeForm]);

    const handleSubmit = () => {
        episodeForm.validateFields().then((values) => {
            const episodes = form.getFieldValue(['episode', serverIndex, 'serverData']) || [];
            form.setFieldsValue({
                episode: {
                    [serverIndex]: {
                        serverData: [...episodes, ...values.episodes],
                    },
                },
            });
            episodeForm.resetFields();
            onClose();
        });
    };

    const toggleAutoSlugify = (index: number) => {
        setAutoSlugify((prev) => {
            const newState = {
                ...prev,
                [index]: !prev[index],
            };
            if (newState[index]) {
                const name = episodeForm.getFieldValue(['episodes', index, 'name']);
                if (name) {
                    const slug = slugify(name);
                    episodeForm.setFieldsValue({
                        episodes: {
                            [index]: {
                                slug: slug,
                            },
                        },
                    });
                }
            }
            return newState;
        });
    };

    const generateSlug = (index: number, name: string) => {
        const slug = slugify(name);
        episodeForm.setFieldsValue({
            episodes: {
                [index]: {
                    slug: slug,
                },
            },
        });
    };

    return (
        <Modal
            title={`Add New Episodes to ${serverName}`}
            open={visible}
            onCancel={onClose}
            onOk={handleSubmit}
            width={800}
        >
            <Form form={episodeForm} layout="vertical">
                <Form.List name="episodes">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map((field, index) => (
                                <Space
                                    key={field.key}
                                    style={{ display: 'flex', marginBottom: 8 }}
                                    align="baseline"
                                >
                                    <Form.Item
                                        {...field}
                                        name={[field.name, 'name']}
                                        rules={[
                                            { required: true, message: 'Episode name is required' },
                                        ]}
                                    >
                                        <Input
                                            placeholder="Episode Name"
                                            onChange={(e) => {
                                                if (autoSlugify[index] !== false) {
                                                    generateSlug(index, e.target.value);
                                                }
                                            }}
                                        />
                                    </Form.Item>
                                    <Tooltip
                                        title={
                                            autoSlugify[index] === false
                                                ? 'Enable auto-slugify'
                                                : 'Disable auto-slugify'
                                        }
                                    >
                                        <Button
                                            icon={<LinkOutlined />}
                                            onClick={() => toggleAutoSlugify(index)}
                                            type={
                                                autoSlugify[index] === false ? 'default' : 'primary'
                                            }
                                        />
                                    </Tooltip>
                                    <Form.Item
                                        {...field}
                                        name={[field.name, 'slug']}
                                        rules={[
                                            { required: true, message: 'Episode slug is required' },
                                            {
                                                pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                                                message:
                                                    'Slug must contain only lowercase letters, numbers, and hyphens',
                                            },
                                        ]}
                                    >
                                        <Input
                                            placeholder="Episode Slug"
                                            disabled={autoSlugify[index] !== false}
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        {...field}
                                        name={[field.name, 'linkM3u8']}
                                        rules={[
                                            {
                                                validator: (_, value) => {
                                                    if (
                                                        !value &&
                                                        !episodeForm.getFieldValue([
                                                            'episodes',
                                                            field.name,
                                                            'linkEmbed',
                                                        ])
                                                    ) {
                                                        return Promise.reject(
                                                            'Either M3U8 Link or Embed Link is required',
                                                        );
                                                    }
                                                    if (value && !isValidUrl(value)) {
                                                        return Promise.reject(
                                                            'Please enter a valid URL',
                                                        );
                                                    }
                                                    return Promise.resolve();
                                                },
                                            },
                                        ]}
                                    >
                                        <Input placeholder="M3U8 Link" />
                                    </Form.Item>
                                    <Form.Item
                                        {...field}
                                        name={[field.name, 'linkEmbed']}
                                        rules={[
                                            {
                                                validator: (_, value) => {
                                                    if (
                                                        !value &&
                                                        !episodeForm.getFieldValue([
                                                            'episodes',
                                                            field.name,
                                                            'linkM3u8',
                                                        ])
                                                    ) {
                                                        return Promise.reject(
                                                            'Either M3U8 Link or Embed Link is required',
                                                        );
                                                    }
                                                    if (value && !isValidUrl(value)) {
                                                        return Promise.reject(
                                                            'Please enter a valid URL',
                                                        );
                                                    }
                                                    return Promise.resolve();
                                                },
                                            },
                                        ]}
                                    >
                                        <Input placeholder="Embed Link" />
                                    </Form.Item>
                                    <MinusCircleOutlined onClick={() => remove(field.name)} />
                                </Space>
                            ))}
                            <Form.Item>
                                <Button
                                    type="dashed"
                                    onClick={() => {
                                        add();
                                        const newIndex = fields.length;
                                        setAutoSlugify((prev) => ({
                                            ...prev,
                                            [newIndex]: true,
                                        }));
                                    }}
                                    block
                                    icon={<PlusOutlined />}
                                >
                                    Add Episode
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>
            </Form>
        </Modal>
    );
};
