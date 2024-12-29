'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    Image,
    Space,
    Tooltip,
    Divider,
    Typography,
} from 'antd';
import { UploadOutlined, PlusCircleOutlined, UndoOutlined, LinkOutlined } from '@ant-design/icons';
import { GetOneResponse, HttpError, useApiUrl, useOne } from '@refinedev/core';
import slugify from 'slugify';
import { removeTone, removeDiacritics } from '@vn-utils/text';
import type { QueryObserverResult } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
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
import { MovieType } from '~api/app/movies/movie.type';

import { ServerEpisodeSection } from './server-episode-section';
import { CHECK_MOVIE_EXIST_SLUG } from '~mnt/queries/movie.query';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export type MovieFormProps = {
    query?: QueryObserverResult<GetOneResponse<MovieType>, HttpError>;
    formProps: FormProps;
    mode: 'create' | 'edit';
};

export const MovieForm: React.FC<MovieFormProps> = ({ formProps, query, mode }) => {
    const router = useRouter();
    const apiUrl = useApiUrl();
    const axios = useAxiosAuth();
    const movie = query?.data?.data;

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
            mode: 'server',
            current: 1,
            pageSize: 500,
        },
        debounce: 500,
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
            mode: 'server',
            current: 1,
            pageSize: 500,
        },
        debounce: 500,
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
            mode: 'server',
            current: 1,
            pageSize: 500,
        },
        debounce: 500,
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
            mode: 'server',
            current: 1,
            pageSize: 500,
        },
        debounce: 500,
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
    const [customQuality, setCustomQuality] = useState('');

    useEffect(() => {
        const initialPosterUrl = formProps.form?.getFieldValue('posterUrl') || '';
        const initialThumbUrl = formProps.form?.getFieldValue('thumbUrl') || '';
        setPosterUrl(initialPosterUrl);
        setThumbUrl(initialThumbUrl);
        setDefaultPosterUrl(initialPosterUrl);
        setDefaultThumbUrl(initialThumbUrl);
    }, [formProps.form]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    const [autoGenerateSlug, setAutoGenerateSlug] = useState(mode === 'create');
    const [slug, setSlug] = useState('');
    const [debouncedSlug] = useDebounce(slug, 800);
    const {
        data: slugData,
        refetch: checkSlug,
        isRefetching: isCheckingSlug,
    } = useOne<MovieType>({
        dataProviderName: 'graphql',
        resource: 'movies',
        id: '',
        queryOptions: {
            enabled: false,
        },
        meta: {
            gqlQuery: CHECK_MOVIE_EXIST_SLUG,
            variables: {
                input: {
                    slug: debouncedSlug,
                },
            },
        },
        errorNotification: false,
        successNotification: false,
    });
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
        if (autoGenerateSlug && mode === 'create') {
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
    }, [formProps.form?.getFieldValue('name'), autoGenerateSlug, generateSlug, mode]);

    useEffect(() => {
        if (debouncedSlug && mode === 'create') {
            checkSlug();
        }
    }, [debouncedSlug, checkSlug, mode]);

    const toggleAutoGenerateSlug = () => {
        if (mode === 'create') {
            setAutoGenerateSlug(!autoGenerateSlug);
        }
    };

    const slugExists = !!slugData?.data;

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        formProps.form?.setFieldsValue({ name });
        if (autoGenerateSlug && mode === 'create' && name) {
            const slugged = generateSlug(name);
            setSlug(slugged);
            formProps.form?.setFieldsValue({ slug: slugged });
        }
    };

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (mode === 'create') {
            const newSlug = e.target.value;
            setSlug(newSlug);
            formProps.form?.setFieldsValue({
                slug: newSlug,
            });
        }
    };

    useEffect(() => {
        const formData = {
            actors: Array.isArray(movie?.actors)
                ? movie.actors.map((actor: ActorType) =>
                      typeof actor === 'object' && actor._id ? actor?._id?.toString() : actor,
                  )
                : [],
            categories: Array.isArray(movie?.categories)
                ? movie.categories.map((category: CategoryType) =>
                      typeof category === 'object' && category._id
                          ? category?._id?.toString()
                          : category,
                  )
                : [],
            countries: Array.isArray(movie?.countries)
                ? movie.countries.map((country: RegionType) =>
                      typeof country === 'object' && country._id
                          ? country?._id?.toString()
                          : country,
                  )
                : [],
            directors: Array.isArray(movie?.directors)
                ? movie.directors.map((director: DirectorType) =>
                      typeof director === 'object' && director._id
                          ? director?._id?.toString()
                          : director,
                  )
                : [],
        };
        Object.entries(formData).forEach(([key, value]) => {
            if (value) {
                formProps?.form.setFieldsValue({ [key]: value });
            }
        });
    }, [movie, formProps?.form]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleFormSubmit = (values: any) => {
        const updatedValues = {
            ...values,
            actors: Array.isArray(values?.actors)
                ? values.actors.map((actor: ActorType) =>
                      typeof actor === 'object' && actor._id ? actor?._id?.toString() : actor,
                  )
                : [],
            categories: Array.isArray(values?.categories)
                ? values.categories.map((category: CategoryType) =>
                      typeof category === 'object' && category._id
                          ? category?._id?.toString()
                          : category,
                  )
                : [],
            countries: Array.isArray(values?.countries)
                ? values.countries.map((country: RegionType) =>
                      typeof country === 'object' && country._id
                          ? country?._id?.toString()
                          : country,
                  )
                : [],
            directors: Array.isArray(values?.directors)
                ? values.directors.map((director: DirectorType) =>
                      typeof director === 'object' && director._id
                          ? director?._id?.toString()
                          : director,
                  )
                : [],
        };
        formProps.onFinish?.(updatedValues);
        router.refresh();
    };

    return (
        <Form {...formProps} layout="vertical" onFinish={handleFormSubmit}>
            <Row gutter={16}>
                <Col span={18}>
                    <Card
                        title={<Title level={4}>Basic Information</Title>}
                        style={{ marginBottom: 16 }}
                    >
                        <Row align="middle">
                            <Col span={11}>
                                <Form.Item
                                    name="name"
                                    label="Movie Name"
                                    rules={[
                                        { required: true, message: 'Name can not be empty' },
                                        { type: 'string', message: 'Name must be a string' },
                                    ]}
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
                                        disabled={mode === 'edit'}
                                    />
                                </Tooltip>
                            </Col>
                            <Col span={11}>
                                <Form.Item
                                    name="slug"
                                    label="Slug"
                                    rules={[
                                        { required: true, message: 'Slug can not be empty' },
                                        { type: 'string', message: 'Slug must be a string' },
                                        {
                                            pattern: /^[a-zA-Z0-9-_]+$/,
                                            message:
                                                'Slug can only contain alphanumeric characters, hyphens, and underscores',
                                        },
                                        {
                                            validator: (_, value) => {
                                                if (mode === 'create' && slugExists) {
                                                    return Promise.reject(
                                                        'This slug already exists',
                                                    );
                                                }
                                                return Promise.resolve();
                                            },
                                        },
                                    ]}
                                    help={
                                        mode === 'create' ? (
                                            isCheckingSlug ? (
                                                <Text type="secondary">
                                                    Checking slug availability...
                                                </Text>
                                            ) : debouncedSlug && slugExists ? (
                                                <Text type="danger">This slug already exists</Text>
                                            ) : debouncedSlug ? (
                                                <Text type="success">Slug is available</Text>
                                            ) : null
                                        ) : (
                                            <Text type="secondary">
                                                Slug cannot be changed in edit mode
                                            </Text>
                                        )
                                    }
                                >
                                    <Input
                                        disabled={mode === 'edit' || autoGenerateSlug}
                                        onChange={handleSlugChange}
                                        readOnly={mode === 'edit'}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="originName"
                                    label="Original Name"
                                    rules={[
                                        {
                                            type: 'string',
                                            message: 'Original name must be a string',
                                        },
                                    ]}
                                >
                                    <Input autoComplete="off" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="year"
                                    label="Year"
                                    rules={[{ type: 'number', message: 'Year must be a number' }]}
                                >
                                    <InputNumber style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item
                            name="content"
                            label="Content"
                            rules={[{ type: 'string', message: 'Content must be a string' }]}
                        >
                            <TextArea rows={4} />
                        </Form.Item>
                    </Card>
                    <Card
                        title={<Title level={4}>Classification</Title>}
                        style={{ marginBottom: 16 }}
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="actors"
                                    label="Actors"
                                    rules={[{ type: 'array', message: 'Actors must be an array' }]}
                                >
                                    <Select
                                        {...actorSelectProps}
                                        options={[
                                            ...(movie?.actors?.map(({ name, _id }) => ({
                                                label: name,
                                                value: _id?.toString(),
                                            })) || []),
                                            ...(actorSelectProps?.options || []),
                                        ].filter(
                                            (actor, index, self) =>
                                                index ===
                                                self.findIndex((t) => t.value === actor.value),
                                        )}
                                        mode="multiple"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="directors"
                                    label="Directors"
                                    rules={[
                                        { type: 'array', message: 'Directors must be an array' },
                                    ]}
                                >
                                    <Select
                                        {...directorSelectProps}
                                        options={[
                                            ...(movie?.directors?.map(({ name, _id }) => ({
                                                label: name,
                                                value: _id?.toString(),
                                            })) || []),
                                            ...(directorSelectProps?.options || []),
                                        ].filter(
                                            (director, index, self) =>
                                                index ===
                                                self.findIndex((t) => t.value === director.value),
                                        )}
                                        mode="multiple"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="categories"
                                    label="Categories"
                                    rules={[
                                        { type: 'array', message: 'Categories must be an array' },
                                    ]}
                                >
                                    <Select
                                        {...categorySelectProps}
                                        options={[
                                            ...(movie?.categories?.map(({ name, _id }) => ({
                                                label: name,
                                                value: _id?.toString(),
                                            })) || []),
                                            ...(categorySelectProps?.options || []),
                                        ].filter(
                                            (category, index, self) =>
                                                index ===
                                                self.findIndex((t) => t.value === category.value),
                                        )}
                                        mode="multiple"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="countries"
                                    label="Countries"
                                    rules={[
                                        { type: 'array', message: 'Countries must be an array' },
                                    ]}
                                >
                                    <Select
                                        {...countrySelectProps}
                                        options={[
                                            ...(movie?.countries?.map(({ name, _id }) => ({
                                                label: name,
                                                value: _id?.toString(),
                                            })) || []),
                                            ...(countrySelectProps?.options || []),
                                        ].filter(
                                            (country, index, self) =>
                                                index ===
                                                self.findIndex((t) => t.value === country.value),
                                        )}
                                        mode="multiple"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>
                    <Card
                        title={<Title level={4}>Additional Information</Title>}
                        style={{ marginBottom: 16 }}
                    >
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item
                                    name="type"
                                    label="Type"
                                    rules={[
                                        { required: true, message: 'Type can not be empty' },
                                        { type: 'enum', enum: Object.values(MovieTypeEnum) },
                                    ]}
                                >
                                    <Select>
                                        {Object.entries(MovieTypeEnum).map(([key, value]) => (
                                            <Option key={key} value={value}>
                                                {key.toUpperCase()}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    name="status"
                                    label="Status"
                                    rules={[
                                        { required: true, message: 'Status can not be empty' },
                                        {
                                            type: 'enum',
                                            enum: Object.values(MovieStatusEnum),
                                            message: 'Invalid movie status',
                                        },
                                    ]}
                                >
                                    <Select>
                                        {Object.entries(MovieStatusEnum).map(([key, value]) => (
                                            <Option key={key} value={value}>
                                                {key.toUpperCase()}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    name="quality"
                                    label="Quality"
                                    rules={[
                                        { type: 'string', message: 'Quality must be a string' },
                                    ]}
                                >
                                    <Select
                                        dropdownRender={(menu) => (
                                            <>
                                                {menu}
                                                <Divider style={{ margin: '8px 0' }} />
                                                <Space style={{ padding: '0 8px 4px' }}>
                                                    <Input
                                                        placeholder="Custom quality"
                                                        value={customQuality}
                                                        onChange={(e) =>
                                                            setCustomQuality(e.target.value)
                                                        }
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
                        </Row>
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item
                                    name="isCopyright"
                                    valuePropName="checked"
                                    label="Is Copyright"
                                    rules={[
                                        {
                                            type: 'boolean',
                                            message: 'Is Copyright must be a boolean',
                                        },
                                    ]}
                                >
                                    <Switch />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    name="cinemaRelease"
                                    valuePropName="checked"
                                    label="Cinema Release"
                                    rules={[
                                        {
                                            type: 'boolean',
                                            message: 'Cinema Release must be a boolean',
                                        },
                                    ]}
                                >
                                    <Switch />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    name="subDocquyen"
                                    valuePropName="checked"
                                    label="Sub Copyright"
                                    rules={[
                                        {
                                            type: 'boolean',
                                            message: 'Sub Copyright must be a boolean',
                                        },
                                    ]}
                                >
                                    <Switch />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={6}>
                                <Form.Item
                                    name="lang"
                                    label="Language"
                                    rules={[
                                        { type: 'string', message: 'Language must be a string' },
                                    ]}
                                >
                                    <Input autoComplete="off" />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    name="time"
                                    label="Duration"
                                    rules={[
                                        { type: 'string', message: 'Duration must be a string' },
                                    ]}
                                >
                                    <Input autoComplete="off" />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    name="episodeCurrent"
                                    label="Current Episode"
                                    rules={[
                                        {
                                            type: 'string',
                                            message: 'Current Episode must be a string',
                                        },
                                    ]}
                                >
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    name="episodeTotal"
                                    label="Total Episodes"
                                    rules={[
                                        {
                                            type: 'string',
                                            message: 'Total Episodes must be a string',
                                        },
                                    ]}
                                >
                                    <Input />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>
                    <Card title="Episodes" style={{ marginBottom: 16 }}>
                        <ServerEpisodeSection form={formProps.form} />
                    </Card>
                    <Card
                        title={<Title level={4}>External IDs</Title>}
                        style={{ marginBottom: 16 }}
                    >
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
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        min={0}
                                        max={10}
                                        step={0.1}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>
                </Col>
                <Col span={6}>
                    <Card title={<Title level={4}>Media</Title>} style={{ marginBottom: 16 }}>
                        <Space direction="vertical">
                            <Form.Item
                                name="posterUrl"
                                label="Poster"
                                rules={[{ type: 'url', message: 'Poster URL must be a valid URL' }]}
                            >
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <Input
                                        value={posterUrl}
                                        onChange={(e) => handleUrlChange(e, 'poster')}
                                        autoComplete="off"
                                    />
                                    <Space>
                                        <Upload
                                            customRequest={(options) =>
                                                customUpload(options, 'poster')
                                            }
                                            showUploadList={false}
                                            beforeUpload={beforeUpload}
                                            accept="image/*"
                                        >
                                            <Button
                                                icon={<UploadOutlined />}
                                                loading={isPostLoading}
                                            >
                                                Upload
                                            </Button>
                                        </Upload>
                                        {posterUrl !== defaultPosterUrl && (
                                            <Button
                                                icon={<UndoOutlined />}
                                                onClick={() => restoreDefaultImage('poster')}
                                            >
                                                Restore Default
                                            </Button>
                                        )}
                                    </Space>
                                </Space>
                            </Form.Item>
                            {posterUrl && (
                                <Image
                                    src={posterUrl}
                                    alt="Movie Poster"
                                    style={{ width: '100%', marginBottom: 16 }}
                                />
                            )}
                            <Form.Item
                                name="thumbUrl"
                                label="Thumbnail"
                                rules={[
                                    { required: true, message: 'Thumb can not be empty' },
                                    { type: 'url', message: 'Thumb URL must be a valid URL' },
                                ]}
                            >
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <Input
                                        value={thumbUrl}
                                        onChange={(e) => handleUrlChange(e, 'thumb')}
                                        autoComplete="off"
                                    />
                                    <Space>
                                        <Upload
                                            customRequest={(options) =>
                                                customUpload(options, 'thumb')
                                            }
                                            showUploadList={false}
                                            beforeUpload={beforeUpload}
                                            accept="image/*"
                                        >
                                            <Button
                                                icon={<UploadOutlined />}
                                                loading={isThumbLoading}
                                            >
                                                Upload
                                            </Button>
                                        </Upload>
                                        {thumbUrl !== defaultThumbUrl && (
                                            <Button
                                                icon={<UndoOutlined />}
                                                onClick={() => restoreDefaultImage('thumb')}
                                            >
                                                Restore Default
                                            </Button>
                                        )}
                                    </Space>
                                </Space>
                            </Form.Item>
                            {thumbUrl && (
                                <Image
                                    src={thumbUrl}
                                    alt="Movie Thumbnail"
                                    style={{ width: '100%', marginBottom: 16 }}
                                />
                            )}
                            <Form.Item
                                name="trailerUrl"
                                label="Trailer URL"
                                rules={[
                                    { type: 'url', message: 'Trailer URL must be a valid URL' },
                                ]}
                            >
                                <Input />
                            </Form.Item>
                        </Space>
                    </Card>
                </Col>
            </Row>
        </Form>
    );
};
