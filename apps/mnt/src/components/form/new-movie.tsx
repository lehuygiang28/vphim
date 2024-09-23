import React, { useEffect, useState } from 'react';
import { useSelect } from '@refinedev/antd';
import {
    Form,
    Input,
    Select,
    InputNumber,
    Switch,
    Upload,
    message,
    Card,
    Row,
    Col,
    Button,
    FormProps,
    ButtonProps,
    Image,
    Space,
    Tooltip,
    Divider,
    Typography,
    Popconfirm,
} from 'antd';
import {
    UploadOutlined,
    PlusCircleOutlined,
    MinusCircleOutlined,
    UndoOutlined,
    LinkOutlined,
    QuestionCircleOutlined,
} from '@ant-design/icons';
import { useApiUrl } from '@refinedev/core';
import slugify from 'slugify';
import { removeTone, removeDiacritics } from '@vn-utils/text';
import { useAxiosAuth } from '@/hooks/useAxiosAuth';

import { ActorType } from '~api/app/actors';
import { CategoryType } from '~api/app/categories';
import { RegionType } from '~api/app/regions/region.type';
import { DirectorType } from '~api/app/directors/director.type';
import { MNT_CATEGORIES_LIST_QUERY } from '~mnt/queries/category.query';
import { GET_ACTOR_LIST_QUERY } from '~mnt/queries/actor.query';
import { MNT_REGIONS_LIST_QUERY } from '~mnt/queries/region.query';
import { GET_DIRECTOR_LIST_QUERY } from '~mnt/queries/director.query';
import { MovieQualityEnum, MovieStatusEnum, MovieTypeEnum } from '~api/app/movies/movie.constant';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export type MovieFormProps = {
    formProps: FormProps;
    saveButtonProps: ButtonProps & {
        onClick: () => void;
    };
};

export const MovieForm: React.FC<MovieFormProps> = ({ formProps, saveButtonProps }) => {
    const apiUrl = useApiUrl();
    const axios = useAxiosAuth();

    const { selectProps: actorSelectProps } = useSelect<ActorType>({
        dataProviderName: 'graphql',
        resource: 'actors',
        optionLabel: 'name',
        optionValue: '_id',
        meta: {
            gqlQuery: GET_ACTOR_LIST_QUERY,
            operation: 'actors',
        },
        pagination: {
            pageSize: 20,
        },
        debounce: 500,
        defaultValue: formProps.form?.getFieldValue('actors') || [],
        onSearch: (value) => [
            {
                field: 'keywords',
                operator: 'contains',
                value: value,
            },
        ],
    });

    const { selectProps: categorySelectProps } = useSelect<CategoryType>({
        dataProviderName: 'graphql',
        resource: 'categories',
        optionLabel: 'name',
        optionValue: '_id',
        meta: {
            gqlQuery: MNT_CATEGORIES_LIST_QUERY,
            operation: 'categories',
        },
        pagination: {
            pageSize: 20,
        },
        debounce: 500,
        defaultValue: formProps.form?.getFieldValue('categories') || [],
        onSearch: (value) => [
            {
                field: 'keywords',
                operator: 'contains',
                value: value,
            },
        ],
    });

    const { selectProps: countrySelectProps } = useSelect<RegionType>({
        dataProviderName: 'graphql',
        resource: 'regions',
        optionLabel: 'name',
        optionValue: '_id',
        meta: {
            gqlQuery: MNT_REGIONS_LIST_QUERY,
            operation: 'regions',
        },
        pagination: {
            pageSize: 20,
        },
        debounce: 500,
        defaultValue: formProps.form?.getFieldValue('countries') || [],
        onSearch: (value) => [
            {
                field: 'keywords',
                operator: 'contains',
                value: value,
            },
        ],
    });

    const { selectProps: directorSelectProps } = useSelect<DirectorType>({
        dataProviderName: 'graphql',
        resource: 'directors',
        optionLabel: 'name',
        optionValue: '_id',
        meta: {
            gqlQuery: GET_DIRECTOR_LIST_QUERY,
            operation: 'directors',
        },
        pagination: {
            pageSize: 20,
        },
        debounce: 500,
        defaultValue: formProps.form?.getFieldValue('directors') || [],
        onSearch: (value) => [
            {
                field: 'keywords',
                operator: 'contains',
                value: value,
            },
        ],
    });

    const [isPostLoading, setIsPostLoading] = useState(false);
    const [isThumbLoading, setIsThumbLoading] = useState(false);
    const [posterUrl, setPosterUrl] = useState('');
    const [thumbUrl, setThumbUrl] = useState('');
    const [defaultPosterUrl, setDefaultPosterUrl] = useState('');
    const [defaultThumbUrl, setDefaultThumbUrl] = useState('');
    const [autoGenerateSlug, setAutoGenerateSlug] = useState(true);
    const [customQuality, setCustomQuality] = useState('');

    useEffect(() => {
        const initialPosterUrl = formProps.form?.getFieldValue('posterUrl') || '';
        const initialThumbUrl = formProps.form?.getFieldValue('thumbUrl') || '';
        setPosterUrl(initialPosterUrl);
        setThumbUrl(initialThumbUrl);
        setDefaultPosterUrl(initialPosterUrl);
        setDefaultThumbUrl(initialThumbUrl);
    }, [formProps.form]);

    const customUpload = async (options: any, type: 'poster' | 'thumb') => {
        const { onSuccess, onError, file } = options;
        setIsPostLoading(type === 'poster');
        setIsThumbLoading(type === 'thumb');

        const formData = new FormData();
        formData.append('images', file);

        try {
            const response = await axios.post(`${apiUrl}/images`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data && response.data[0] && response.data[0].url) {
                onSuccess(response, file);
                const newUrl = response.data[0].url;
                formProps.form?.setFieldsValue({
                    [type === 'poster' ? 'posterUrl' : 'thumbUrl']: newUrl,
                });
                if (type === 'poster') {
                    setPosterUrl(newUrl);
                } else {
                    setThumbUrl(newUrl);
                }
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            onError({ error });
            message.error('Image upload failed, please try again later!');
        } finally {
            setIsPostLoading(false);
            setIsThumbLoading(false);
        }
    };

    const beforeUpload = (file: File) => {
        const isAllowedType = ALLOWED_FILE_TYPES.includes(file.type);
        if (!isAllowedType) {
            message.error('Invalid image format (JPG/PNG/GIF/WebP)');
        }
        const isLessThan10MB = file.size <= MAX_FILE_SIZE;
        if (!isLessThan10MB) {
            message.error('Image size is too large (max 10MB)');
        }
        return isAllowedType && isLessThan10MB;
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'poster' | 'thumb') => {
        const newUrl = e.target.value;
        if (type === 'poster') {
            setPosterUrl(newUrl);
        } else {
            setThumbUrl(newUrl);
        }
        formProps.form?.setFieldsValue({
            [type === 'poster' ? 'posterUrl' : 'thumbUrl']: newUrl,
        });
    };

    const restoreDefaultImage = (type: 'poster' | 'thumb') => {
        const defaultUrl = type === 'poster' ? defaultPosterUrl : defaultThumbUrl;
        if (type === 'poster') {
            setPosterUrl(defaultUrl);
        } else {
            setThumbUrl(defaultUrl);
        }
        formProps.form?.setFieldsValue({
            [type === 'poster' ? 'posterUrl' : 'thumbUrl']: defaultUrl,
        });
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        formProps.form?.setFieldsValue({ name });
        if (autoGenerateSlug) {
            const slug = slugify(removeTone(removeDiacritics(name)), { lower: true, strict: true });
            formProps.form?.setFieldsValue({ slug });
        }
    };

    const toggleAutoGenerateSlug = () => {
        setAutoGenerateSlug(!autoGenerateSlug);
        if (!autoGenerateSlug) {
            const name = formProps.form?.getFieldValue('name');
            if (!name) {
                return;
            }
            const slug = slugify(removeTone(removeDiacritics(name)), { lower: true, strict: true });
            formProps.form?.setFieldsValue({ slug });
        }
    };

    return (
        <Form {...formProps} layout="vertical">
            <Card title={<Title level={4}>Basic Information</Title>} style={{ marginBottom: 16 }}>
                <Row align="middle">
                    <Col span={11}>
                        <Form.Item
                            name="name"
                            label="Movie Name"
                            rules={[{ required: true, message: 'Please enter the movie name' }]}
                        >
                            <Input onChange={handleNameChange} autoComplete="off" />
                        </Form.Item>
                    </Col>
                    <Col span={2} style={{ textAlign: 'center' }}>
                        <Tooltip
                            title={
                                autoGenerateSlug
                                    ? 'Disable auto-generate slug'
                                    : 'Enable auto-generate slug'
                            }
                        >
                            <Button
                                icon={<LinkOutlined />}
                                onClick={toggleAutoGenerateSlug}
                                type={autoGenerateSlug ? 'primary' : 'default'}
                            />
                        </Tooltip>
                    </Col>
                    <Col span={11}>
                        <Form.Item
                            name="slug"
                            label="Slug"
                            rules={[{ required: true, message: 'Please enter the slug' }]}
                        >
                            <Input disabled={autoGenerateSlug} autoComplete="off" />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="originName" label="Original Name">
                            <Input autoComplete="off" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="year" label="Year">
                            <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item name="content" label="Content">
                    <TextArea rows={4} />
                </Form.Item>
            </Card>

            <Card title={<Title level={4}>Media</Title>} style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="Poster">
                            <Input
                                value={posterUrl}
                                onChange={(e) => handleUrlChange(e, 'poster')}
                                autoComplete="off"
                                addonAfter={
                                    <Upload
                                        customRequest={(options) => customUpload(options, 'poster')}
                                        showUploadList={false}
                                        beforeUpload={beforeUpload}
                                        accept="image/*"
                                    >
                                        <Button icon={<UploadOutlined />} loading={isPostLoading}>
                                            Upload
                                        </Button>
                                    </Upload>
                                }
                            />
                        </Form.Item>
                        {posterUrl && (
                            <Image
                                src={posterUrl}
                                alt="Movie Poster"
                                style={{ maxWidth: '100%', marginBottom: 16 }}
                            />
                        )}
                        {posterUrl !== defaultPosterUrl && (
                            <Button
                                icon={<UndoOutlined />}
                                onClick={() => restoreDefaultImage('poster')}
                            >
                                Restore Default
                            </Button>
                        )}
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Thumbnail">
                            <Input
                                value={thumbUrl}
                                onChange={(e) => handleUrlChange(e, 'thumb')}
                                autoComplete="off"
                                addonAfter={
                                    <Upload
                                        customRequest={(options) => customUpload(options, 'thumb')}
                                        showUploadList={false}
                                        beforeUpload={beforeUpload}
                                        accept="image/*"
                                    >
                                        <Button icon={<UploadOutlined />} loading={isThumbLoading}>
                                            Upload
                                        </Button>
                                    </Upload>
                                }
                            />
                        </Form.Item>
                        {thumbUrl && (
                            <Image
                                src={thumbUrl}
                                alt="Movie Thumbnail"
                                style={{ maxWidth: '100%', marginBottom: 16 }}
                            />
                        )}
                        {thumbUrl !== defaultThumbUrl && (
                            <Button
                                icon={<UndoOutlined />}
                                onClick={() => restoreDefaultImage('thumb')}
                            >
                                Restore Default
                            </Button>
                        )}
                    </Col>
                </Row>
                <Form.Item name="trailerUrl" label="Trailer URL">
                    <Input />
                </Form.Item>
            </Card>

            <Card title={<Title level={4}>Classification</Title>} style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="actors" label="Actors">
                            <Select {...actorSelectProps} mode="multiple" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="directors" label="Directors">
                            <Select {...directorSelectProps} mode="multiple" />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="categories" label="Categories">
                            <Select {...categorySelectProps} mode="multiple" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="countries" label="Countries">
                            <Select {...countrySelectProps} mode="multiple" />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            <Card
                title={<Title level={4}>Additional Information</Title>}
                style={{ marginBottom: 16 }}
            >
                <Row gutter={16}>
                    <Col span={4}>
                        <Form.Item name="type" label="Type">
                            <Select>
                                {Object.entries(MovieTypeEnum).map(([key, value]) => (
                                    <Option key={key} value={value}>
                                        {key.toUpperCase()}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={4}>
                        <Form.Item name="status" label="Status">
                            <Select>
                                {Object.entries(MovieStatusEnum).map(([key, value]) => (
                                    <Option key={key} value={value}>
                                        {key.toUpperCase()}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={4}>
                        <Form.Item name="quality" label="Quality">
                            <Select
                                dropdownRender={(menu) => (
                                    <>
                                        {menu}
                                        <Divider style={{ margin: '8px 0' }} />
                                        <Space style={{ padding: '0 8px 4px' }}>
                                            <Input
                                                placeholder="Custom quality"
                                                value={customQuality}
                                                onChange={(e) => setCustomQuality(e.target.value)}
                                            />
                                            <Button
                                                type="text"
                                                icon={<PlusCircleOutlined />}
                                                onClick={() => {
                                                    if (customQuality) {
                                                        formProps.form?.setFieldsValue({
                                                            quality: customQuality,
                                                        });
                                                        setCustomQuality('');
                                                    }
                                                }}
                                            >
                                                Add
                                            </Button>
                                        </Space>
                                    </>
                                )}
                            >
                                {Object.entries(MovieQualityEnum).map(([key, value]) => (
                                    <Option key={key} value={value}>
                                        {value.toUpperCase()}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={4}>
                        <Form.Item name="isCopyright" valuePropName="checked" label="Is Copyright">
                            <Switch />
                        </Form.Item>
                    </Col>
                    <Col span={4}>
                        <Form.Item
                            name="cinemaRelease"
                            valuePropName="checked"
                            label="Cinema Release"
                        >
                            <Switch />
                        </Form.Item>
                    </Col>
                    <Col span={4}>
                        <Form.Item name="subDocquyen" valuePropName="checked" label="Sub Docquyen">
                            <Switch />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={6}>
                        <Form.Item name="lang" label="Language">
                            <Input autoComplete="off" />
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item name="time" label="Duration">
                            <Input autoComplete="off" />
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item name="episodeCurrent" label="Current Episode">
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item name="episodeTotal" label="Total Episodes">
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            <Card title={<Title level={4}>Episodes</Title>} style={{ marginBottom: 16 }}>
                <Form.List name="episode">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map((field, index) => (
                                <Card
                                    key={field.key}
                                    style={{ marginBottom: 16 }}
                                    type="inner"
                                    title={`Server ${index + 1}`}
                                    extra={
                                        <Popconfirm
                                            title="Are you sure you want to delete this server?"
                                            onConfirm={() => remove(field.name)}
                                            okText="Yes"
                                            cancelText="No"
                                            icon={
                                                <QuestionCircleOutlined style={{ color: 'red' }} />
                                            }
                                        >
                                            <Button icon={<MinusCircleOutlined />} danger>
                                                Remove Server
                                            </Button>
                                        </Popconfirm>
                                    }
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
                                        <Input />
                                    </Form.Item>
                                    <Form.List name={[field.name, 'serverData']}>
                                        {(
                                            subFields,
                                            { add: addEpisode, remove: removeEpisode },
                                        ) => (
                                            <>
                                                {subFields.map((subField, subIndex) => (
                                                    <Card
                                                        key={subField.key}
                                                        style={{ marginBottom: 16 }}
                                                        type="inner"
                                                        title={`Episode ${subIndex + 1}`}
                                                        extra={
                                                            <Popconfirm
                                                                title="Are you sure you want to delete this episode?"
                                                                onConfirm={() =>
                                                                    removeEpisode(subField.name)
                                                                }
                                                                okText="Yes"
                                                                cancelText="No"
                                                                icon={
                                                                    <QuestionCircleOutlined
                                                                        style={{ color: 'red' }}
                                                                    />
                                                                }
                                                            >
                                                                <Button
                                                                    icon={<MinusCircleOutlined />}
                                                                    danger
                                                                >
                                                                    Remove Episode
                                                                </Button>
                                                            </Popconfirm>
                                                        }
                                                    >
                                                        <Row gutter={16}>
                                                            <Col span={12}>
                                                                <Form.Item
                                                                    {...subField}
                                                                    label="Name"
                                                                    name={[subField.name, 'name']}
                                                                    rules={[
                                                                        {
                                                                            required: true,
                                                                            message:
                                                                                'Episode name is required',
                                                                        },
                                                                    ]}
                                                                >
                                                                    <Input />
                                                                </Form.Item>
                                                            </Col>
                                                            <Col span={12}>
                                                                <Form.Item
                                                                    {...subField}
                                                                    label="Slug"
                                                                    name={[subField.name, 'slug']}
                                                                    rules={[
                                                                        {
                                                                            required: true,
                                                                            message:
                                                                                'Episode slug is required',
                                                                        },
                                                                    ]}
                                                                >
                                                                    <Input />
                                                                </Form.Item>
                                                            </Col>
                                                        </Row>
                                                        <Form.Item
                                                            {...subField}
                                                            label="Filename"
                                                            name={[subField.name, 'filename']}
                                                        >
                                                            <Input />
                                                        </Form.Item>
                                                        <Form.Item
                                                            {...subField}
                                                            label="M3U8 Link"
                                                            name={[subField.name, 'linkM3u8']}
                                                        >
                                                            <Input />
                                                        </Form.Item>
                                                        <Form.Item
                                                            {...subField}
                                                            label="Embed Link"
                                                            name={[subField.name, 'linkEmbed']}
                                                        >
                                                            <Input />
                                                        </Form.Item>
                                                    </Card>
                                                ))}
                                                <Form.Item>
                                                    <Button
                                                        type="dashed"
                                                        onClick={() => addEpisode()}
                                                        block
                                                        icon={<PlusCircleOutlined />}
                                                        style={{
                                                            color: 'green',
                                                        }}
                                                    >
                                                        Add Episode
                                                    </Button>
                                                </Form.Item>
                                            </>
                                        )}
                                    </Form.List>
                                </Card>
                            ))}
                            <Form.Item>
                                <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    block
                                    icon={<PlusCircleOutlined />}
                                    style={{
                                        color: 'green',
                                    }}
                                >
                                    Add Server
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>
            </Card>

            <Card title={<Title level={4}>External IDs</Title>} style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="IMDB ID" name={['imdb', 'id']}>
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="TMDB ID" name={['tmdb', 'id']}>
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item label="TMDB Type" name={['tmdb', 'type']}>
                            <Select>
                                <Option value="movie">Movie</Option>
                                <Option value="tv">TV</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item label="TMDB Season" name={['tmdb', 'season']}>
                            <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item label="TMDB Vote Average" name={['tmdb', 'voteAverage']}>
                            <InputNumber style={{ width: '100%' }} min={0} max={10} step={0.1} />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            <Form.Item>
                <Button type="primary" htmlType="submit" {...saveButtonProps}>
                    Save
                </Button>
            </Form.Item>
        </Form>
    );
};
