'use client';

import React, { useState, useEffect } from 'react';
import { MinusCircleOutlined, LinkOutlined, PlusCircleOutlined } from '@ant-design/icons';
import {
    Button,
    Card,
    Col,
    Form,
    Input,
    Row,
    Select,
    Collapse,
    Tooltip,
    Modal,
    message,
    type FormProps,
} from 'antd';
import slugify from 'slugify';

const { Option } = Select;
const { Panel } = Collapse;

const generateSlug = (name: string) => {
    return slugify(name, {
        lower: true,
        strict: true,
    });
};

export type ServerEpisodeTabProps = {
    formProps: FormProps<unknown>;
};

export function ServerEpisodeTab({ formProps }: ServerEpisodeTabProps) {
    const [autoGenerateSlug, setAutoGenerateSlug] = useState(true);
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [itemToRemove, setItemToRemove] = useState<{
        type: 'server' | 'episode';
        serverIndex: number;
        episodeIndex?: number;
    }>({ type: 'server', serverIndex: -1 });
    const [activeServerKeys, setActiveServerKeys] = useState<string[]>([]);
    const [activeEpisodeKeys, setActiveEpisodeKeys] = useState<{ [key: number]: string[] }>({});

    useEffect(() => {
        const episodes = formProps?.form.getFieldValue('episode') || [];
        setActiveServerKeys(episodes.map((_, index) => index.toString()));
        const newActiveEpisodeKeys = {};
        episodes.forEach((server, serverIndex) => {
            newActiveEpisodeKeys[serverIndex] = (server.serverData || []).map((_, index) =>
                index.toString(),
            );
        });
        setActiveEpisodeKeys(newActiveEpisodeKeys);
    }, [formProps?.form]);

    const handleGenerateSlug = (
        episodeField: unknown,
        episodeIndex: number,
        serverIndex: number,
    ) => {
        const episodeName = formProps?.form.getFieldValue([
            'episode',
            serverIndex,
            'serverData',
            episodeIndex,
            'name',
        ]);
        if (episodeName) {
            const slug = generateSlug(episodeName);
            formProps?.form.setFieldsValue({
                ['episode']: {
                    [serverIndex]: {
                        serverData: {
                            [episodeIndex]: {
                                slug: slug,
                            },
                        },
                    },
                },
            });
        }
    };

    const toggleAutoGenerateSlug = (
        episodeField: unknown,
        episodeIndex: number,
        serverIndex: number,
    ) => {
        setAutoGenerateSlug((prev) => {
            const newValue = !prev;
            if (newValue) {
                handleGenerateSlug(episodeField, episodeIndex, serverIndex);
            }
            return newValue;
        });
    };

    const showConfirmModal = (
        type: 'server' | 'episode',
        serverIndex: number,
        episodeIndex?: number,
    ) => {
        setItemToRemove({ type, serverIndex, episodeIndex });
        setConfirmModalVisible(true);
    };

    const handleConfirmRemove = () => {
        const { type, serverIndex, episodeIndex } = itemToRemove;
        const episodes = formProps?.form.getFieldValue('episode') || [];

        if (type === 'server') {
            if (serverIndex >= 0 && serverIndex < episodes.length) {
                episodes.splice(serverIndex, 1);
                formProps?.form.setFieldsValue({ episode: episodes });
                setActiveServerKeys(
                    activeServerKeys.filter((key) => key !== serverIndex.toString()),
                );
            } else {
                message.error('Unable to remove server. It may have already been removed.');
            }
        } else if (type === 'episode' && episodeIndex !== undefined) {
            const serverData = episodes[serverIndex]?.serverData || [];
            if (episodeIndex >= 0 && episodeIndex < serverData.length) {
                serverData.splice(episodeIndex, 1);
                formProps?.form.setFieldsValue({
                    episode: {
                        ...episodes,
                        [serverIndex]: {
                            ...episodes[serverIndex],
                            serverData: serverData,
                        },
                    },
                });
                setActiveEpisodeKeys({
                    ...activeEpisodeKeys,
                    [serverIndex]: activeEpisodeKeys[serverIndex].filter(
                        (key) => key !== episodeIndex.toString(),
                    ),
                });
            } else {
                message.error('Unable to remove episode. It may have already been removed.');
            }
        }
        setConfirmModalVisible(false);
    };

    return (
        <Card
            title="Server and Episode Information"
            style={{ marginTop: 8 }}
            bordered={false}
            size="small"
        >
            <Form.Item label="Trailer URL" name="trailerUrl">
                <Input size="small" />
            </Form.Item>
            <Row gutter={8}>
                <Col span={8}>
                    <Form.Item label="Episode Current" name="episodeCurrent">
                        <Input size="small" />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item label="Episode Total" name="episodeTotal">
                        <Input size="small" />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item label="Status" name="status">
                        <Select size="small">
                            <Option value="ongoing">Ongoing</Option>
                            <Option value="completed">Completed</Option>
                            <Option value="trailer">Trailer</Option>
                        </Select>
                    </Form.Item>
                </Col>
            </Row>

            <Form.List name="episode">
                {(fields, { add, remove }) => (
                    <>
                        <Collapse
                            activeKey={activeServerKeys}
                            onChange={(keys) => setActiveServerKeys(keys as string[])}
                        >
                            {fields.map((field, serverIndex) => (
                                <Panel
                                    header={`Server ${serverIndex + 1}`}
                                    key={serverIndex.toString()}
                                >
                                    <Card
                                        style={{
                                            marginBottom: 16,
                                            borderColor: 'rgba(255,165,0,0.3)',
                                            borderWidth: '0.3rem',
                                        }}
                                        size="small"
                                    >
                                        <Form.Item
                                            {...field}
                                            label="Server Name"
                                            name={[field.name, 'serverName']}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: 'Server name is required',
                                                },
                                            ]}
                                        >
                                            <Input size="small" />
                                        </Form.Item>

                                        <Form.List name={[field.name, 'serverData']}>
                                            {(
                                                episodeFields,
                                                { add: addEpisode, remove: removeEpisode },
                                            ) => (
                                                <>
                                                    <Collapse
                                                        activeKey={
                                                            activeEpisodeKeys[serverIndex] || []
                                                        }
                                                        onChange={(keys) =>
                                                            setActiveEpisodeKeys({
                                                                ...activeEpisodeKeys,
                                                                [serverIndex]: keys as string[],
                                                            })
                                                        }
                                                    >
                                                        {episodeFields.map(
                                                            (episodeField, episodeIndex) => (
                                                                <Panel
                                                                    header={`Episode ${
                                                                        episodeIndex + 1
                                                                    }`}
                                                                    key={episodeIndex.toString()}
                                                                    style={{
                                                                        marginBottom: 8,
                                                                        borderColor:
                                                                            'rgba(238,130,238,0.3)',
                                                                        backgroundColor:
                                                                            'rgba(238,130,238,0.1)',
                                                                    }}
                                                                >
                                                                    <Row gutter={8} align="middle">
                                                                        <Col span={11}>
                                                                            <Form.Item
                                                                                {...episodeField}
                                                                                name={[
                                                                                    episodeField.name,
                                                                                    'name',
                                                                                ]}
                                                                                label="Name"
                                                                                rules={[
                                                                                    {
                                                                                        required:
                                                                                            true,
                                                                                        message:
                                                                                            'Name is required',
                                                                                    },
                                                                                ]}
                                                                            >
                                                                                <Input
                                                                                    size="small"
                                                                                    onChange={() => {
                                                                                        if (
                                                                                            autoGenerateSlug
                                                                                        ) {
                                                                                            handleGenerateSlug(
                                                                                                episodeField,
                                                                                                episodeIndex,
                                                                                                serverIndex,
                                                                                            );
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            </Form.Item>
                                                                        </Col>
                                                                        <Col
                                                                            span={2}
                                                                            style={{
                                                                                textAlign: 'center',
                                                                            }}
                                                                        >
                                                                            <Tooltip title="Auto generate slug">
                                                                                <Button
                                                                                    icon={
                                                                                        <LinkOutlined />
                                                                                    }
                                                                                    onClick={() =>
                                                                                        toggleAutoGenerateSlug(
                                                                                            episodeField,
                                                                                            episodeIndex,
                                                                                            serverIndex,
                                                                                        )
                                                                                    }
                                                                                    type={
                                                                                        autoGenerateSlug
                                                                                            ? 'primary'
                                                                                            : 'default'
                                                                                    }
                                                                                    size="small"
                                                                                />
                                                                            </Tooltip>
                                                                        </Col>
                                                                        <Col span={11}>
                                                                            <Form.Item
                                                                                {...episodeField}
                                                                                name={[
                                                                                    episodeField.name,
                                                                                    'slug',
                                                                                ]}
                                                                                label="Slug"
                                                                            >
                                                                                <Input
                                                                                    size="small"
                                                                                    disabled={
                                                                                        autoGenerateSlug
                                                                                    }
                                                                                />
                                                                            </Form.Item>
                                                                        </Col>
                                                                    </Row>
                                                                    <Row gutter={8}>
                                                                        <Col span={12}>
                                                                            <Form.Item
                                                                                {...episodeField}
                                                                                name={[
                                                                                    episodeField.name,
                                                                                    'filename',
                                                                                ]}
                                                                                label="Filename"
                                                                            >
                                                                                <Input size="small" />
                                                                            </Form.Item>
                                                                        </Col>
                                                                        <Col span={12}>
                                                                            <Form.Item
                                                                                {...episodeField}
                                                                                name={[
                                                                                    episodeField.name,
                                                                                    'linkM3u8',
                                                                                ]}
                                                                                label="M3U8 Link"
                                                                            >
                                                                                <Input size="small" />
                                                                            </Form.Item>
                                                                        </Col>
                                                                    </Row>
                                                                    <Form.Item
                                                                        {...episodeField}
                                                                        name={[
                                                                            episodeField.name,
                                                                            'linkEmbed',
                                                                        ]}
                                                                        label="Embed Link"
                                                                    >
                                                                        <Input size="small" />
                                                                    </Form.Item>
                                                                    <Button
                                                                        type="dashed"
                                                                        onClick={() =>
                                                                            showConfirmModal(
                                                                                'episode',
                                                                                serverIndex,
                                                                                episodeIndex,
                                                                            )
                                                                        }
                                                                        block
                                                                        icon={
                                                                            <MinusCircleOutlined />
                                                                        }
                                                                        style={{
                                                                            color: 'red',
                                                                        }}
                                                                        size="small"
                                                                    >
                                                                        Remove Episode
                                                                    </Button>
                                                                </Panel>
                                                            ),
                                                        )}
                                                    </Collapse>
                                                    <Form.Item>
                                                        <Button
                                                            type="dashed"
                                                            onClick={() => {
                                                                addEpisode();
                                                                const newEpisodeIndex =
                                                                    episodeFields.length;
                                                                setActiveEpisodeKeys({
                                                                    ...activeEpisodeKeys,
                                                                    [serverIndex]: [
                                                                        ...(activeEpisodeKeys[
                                                                            serverIndex
                                                                        ] || []),
                                                                        newEpisodeIndex.toString(),
                                                                    ],
                                                                });
                                                            }}
                                                            block
                                                            icon={<PlusCircleOutlined />}
                                                            style={{
                                                                color: 'green',
                                                            }}
                                                            size="small"
                                                        >
                                                            Add Episode
                                                        </Button>
                                                    </Form.Item>
                                                </>
                                            )}
                                        </Form.List>
                                        <Button
                                            type="dashed"
                                            onClick={() => showConfirmModal('server', serverIndex)}
                                            block
                                            icon={<MinusCircleOutlined />}
                                            style={{
                                                color: 'red',
                                            }}
                                            size="small"
                                        >
                                            Remove Server
                                        </Button>
                                    </Card>
                                </Panel>
                            ))}
                        </Collapse>
                        <Form.Item>
                            <Button
                                type="dashed"
                                onClick={() => {
                                    add();
                                    const newServerIndex = fields.length;
                                    setActiveServerKeys([
                                        ...activeServerKeys,
                                        newServerIndex.toString(),
                                    ]);
                                }}
                                block
                                icon={<PlusCircleOutlined />}
                                size="small"
                            >
                                Add Server
                            </Button>
                        </Form.Item>
                    </>
                )}
            </Form.List>
            <Modal
                title="Confirm Removal"
                open={confirmModalVisible}
                onOk={handleConfirmRemove}
                onCancel={() => setConfirmModalVisible(false)}
            >
                <p>Are you sure you want to remove this {itemToRemove.type}?</p>
            </Modal>
        </Card>
    );
}
