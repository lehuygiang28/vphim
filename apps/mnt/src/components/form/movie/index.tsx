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
    Tag,
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
import {
    MovieQualityEnum,
    MovieStatusEnum,
    MovieTypeEnum,
    MovieContentRatingEnum,
} from '~api/app/movies/movie.constant';
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

    const [isPosterLoading, setIsPosterLoading] = useState(false);
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
        setIsPosterLoading(type === 'poster');
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
            message.error('Tải ảnh thất bại, vui lòng thử lại sau!');
        } finally {
            setIsPosterLoading(false);
            setIsThumbLoading(false);
        }
    };

    const beforeUpload = (file: File) => {
        const isAllowedType = ALLOWED_FILE_TYPES.includes(file.type);
        if (!isAllowedType) {
            message.error('Định dạng ảnh không hợp lệ (JPG/PNG/GIF/WebP)');
        }
        const isLessThan10MB = file.size <= MAX_FILE_SIZE;
        if (!isLessThan10MB) {
            message.error('Kích thước ảnh quá lớn (tối đa 10MB)');
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
                        title={<Title level={4}>Thông tin cơ bản</Title>}
                        style={{ marginBottom: 16 }}
                    >
                        <Row align="middle">
                            <Col span={11}>
                                <Form.Item
                                    name="name"
                                    label="Tên phim"
                                    rules={[
                                        { required: true, message: 'Tên phim không được để trống' },
                                        { type: 'string', message: 'Tên phim phải là chuỗi' },
                                    ]}
                                >
                                    <Input onChange={handleNameChange} autoComplete="off" />
                                </Form.Item>
                            </Col>
                            <Col span={2} style={{ textAlign: 'center' }}>
                                <Tooltip
                                    title={
                                        autoGenerateSlug
                                            ? 'Tắt tự động tạo slug'
                                            : 'Bật tự động tạo slug'
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
                                        { required: true, message: 'Slug không được để trống' },
                                        { type: 'string', message: 'Slug phải là chuỗi' },
                                        {
                                            pattern: /^[a-zA-Z0-9-_]+$/,
                                            message:
                                                'Slug chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới',
                                        },
                                        {
                                            validator: (_, value) => {
                                                if (mode === 'create' && slugExists) {
                                                    return Promise.reject('Slug này đã tồn tại');
                                                }
                                                return Promise.resolve();
                                            },
                                        },
                                    ]}
                                    help={
                                        mode === 'create' ? (
                                            isCheckingSlug ? (
                                                <Text type="secondary">Đang kiểm tra slug...</Text>
                                            ) : debouncedSlug && slugExists ? (
                                                <Text type="danger">Slug này đã tồn tại</Text>
                                            ) : debouncedSlug ? (
                                                <Text type="success">Slug có thể sử dụng</Text>
                                            ) : null
                                        ) : (
                                            <Text type="secondary">
                                                Không thể thay đổi slug khi chỉnh sửa
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
                                    label="Tên gốc"
                                    rules={[
                                        {
                                            type: 'string',
                                            message: 'Tên gốc phải là chuỗi',
                                        },
                                    ]}
                                >
                                    <Input autoComplete="off" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="year"
                                    label="Năm"
                                    rules={[{ type: 'number', message: 'Năm phải là số' }]}
                                >
                                    <InputNumber style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item
                            name="content"
                            label="Nội dung"
                            rules={[{ type: 'string', message: 'Nội dung phải là chuỗi' }]}
                        >
                            <TextArea rows={4} />
                        </Form.Item>
                    </Card>
                    <Card title={<Title level={4}>Phân loại</Title>} style={{ marginBottom: 16 }}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="actors"
                                    label="Diễn viên"
                                    rules={[{ type: 'array', message: 'Diễn viên phải là mảng' }]}
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
                                    label="Đạo diễn"
                                    rules={[{ type: 'array', message: 'Đạo diễn phải là mảng' }]}
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
                                    label="Thể loại"
                                    rules={[{ type: 'array', message: 'Thể loại phải là mảng' }]}
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
                                    label="Quốc gia"
                                    rules={[{ type: 'array', message: 'Quốc gia phải là mảng' }]}
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
                        title={<Title level={4}>Thông tin bổ sung</Title>}
                        style={{ marginBottom: 16 }}
                    >
                        <Row gutter={16}>
                            <Col span={6}>
                                <Form.Item
                                    name="type"
                                    label="Loại"
                                    rules={[
                                        { required: true, message: 'Loại không được để trống' },
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
                            <Col span={6}>
                                <Form.Item
                                    name="status"
                                    label="Trạng thái"
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Trạng thái không được để trống',
                                        },
                                        {
                                            type: 'enum',
                                            enum: Object.values(MovieStatusEnum),
                                            message: 'Trạng thái phim không hợp lệ',
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
                            <Col span={6}>
                                <Form.Item
                                    name="contentRating"
                                    label="Phân loại độ tuổi"
                                    tooltip="Phân loại độ tuổi phù hợp cho người xem theo quy định Việt Nam"
                                    rules={[
                                        {
                                            type: 'enum',
                                            enum: Object.values(MovieContentRatingEnum),
                                            message: 'Phân loại không hợp lệ',
                                        },
                                    ]}
                                >
                                    <Select placeholder="Chọn phân loại">
                                        {Object.entries(MovieContentRatingEnum).map(
                                            ([key, value]) => {
                                                let description = '';

                                                switch (value) {
                                                    case MovieContentRatingEnum.P:
                                                        description =
                                                            'Phù hợp mọi độ tuổi, không hạn chế';
                                                        break;
                                                    case MovieContentRatingEnum.K:
                                                        description =
                                                            'Dưới 13 tuổi cần có người lớn hướng dẫn';
                                                        break;
                                                    case MovieContentRatingEnum.T13:
                                                        description = 'Từ 13 tuổi trở lên';
                                                        break;
                                                    case MovieContentRatingEnum.T16:
                                                        description = 'Từ 16 tuổi trở lên';
                                                        break;
                                                    case MovieContentRatingEnum.T18:
                                                        description = 'Từ 18 tuổi trở lên';
                                                        break;
                                                    case MovieContentRatingEnum.C:
                                                        description = 'Không được phép phổ biến';
                                                        break;
                                                    default:
                                                        break;
                                                }

                                                return (
                                                    <Option key={key} value={value}>
                                                        <Space>
                                                            <Tag
                                                                color={
                                                                    value ===
                                                                    MovieContentRatingEnum.P
                                                                        ? 'green'
                                                                        : value ===
                                                                          MovieContentRatingEnum.K
                                                                        ? 'cyan'
                                                                        : value ===
                                                                          MovieContentRatingEnum.T13
                                                                        ? 'blue'
                                                                        : value ===
                                                                          MovieContentRatingEnum.T16
                                                                        ? 'orange'
                                                                        : value ===
                                                                          MovieContentRatingEnum.T18
                                                                        ? 'volcano'
                                                                        : 'red'
                                                                }
                                                            >
                                                                {value}
                                                            </Tag>
                                                            <span>{description}</span>
                                                        </Space>
                                                    </Option>
                                                );
                                            },
                                        )}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    name="quality"
                                    label="Chất lượng"
                                    rules={[
                                        { type: 'string', message: 'Chất lượng phải là chuỗi' },
                                    ]}
                                >
                                    <Select
                                        dropdownRender={(menu) => (
                                            <>
                                                {menu}
                                                <Divider style={{ margin: '8px 0' }} />
                                                <Space style={{ padding: '0 8px 4px' }}>
                                                    <Input
                                                        placeholder="Chất lượng tùy chỉnh"
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
                                                        Thêm
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
                                    label="Bản quyền"
                                    rules={[
                                        {
                                            type: 'boolean',
                                            message: 'Bản quyền phải là boolean',
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
                                    label="Phát hành rạp"
                                    rules={[
                                        {
                                            type: 'boolean',
                                            message: 'Phát hành rạp phải là boolean',
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
                                    label="Sub độc quyền"
                                    rules={[
                                        {
                                            type: 'boolean',
                                            message: 'Sub độc quyền phải là boolean',
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
                                    label="Ngôn ngữ"
                                    rules={[{ type: 'string', message: 'Ngôn ngữ phải là chuỗi' }]}
                                >
                                    <Input autoComplete="off" />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    name="time"
                                    label="Thời lượng"
                                    rules={[
                                        { type: 'string', message: 'Thời lượng phải là chuỗi' },
                                    ]}
                                >
                                    <Input autoComplete="off" />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    name="episodeCurrent"
                                    label="Tập hiện tại"
                                    rules={[
                                        {
                                            type: 'string',
                                            message: 'Tập hiện tại phải là chuỗi',
                                        },
                                    ]}
                                >
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    name="episodeTotal"
                                    label="Tổng số tập"
                                    rules={[
                                        {
                                            type: 'string',
                                            message: 'Tổng số tập phải là chuỗi',
                                        },
                                    ]}
                                >
                                    <Input />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>
                    <Card title="Tập phim" style={{ marginBottom: 16 }}>
                        <ServerEpisodeSection form={formProps.form} />
                    </Card>
                    <Card
                        title={<Title level={4}>ID bên ngoài</Title>}
                        style={{ marginBottom: 16 }}
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="ID IMDB" name={['imdb', 'id']}>
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="ID TMDB" name={['tmdb', 'id']}>
                                    <Input />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item label="Loại TMDB" name={['tmdb', 'type']}>
                                    <Select>
                                        <Option value="movie">Phim lẻ</Option>
                                        <Option value="tv">Phim bộ</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Mùa TMDB" name={['tmdb', 'season']}>
                                    <InputNumber style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Điểm TMDB" name={['tmdb', 'voteAverage']}>
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
                    <Card title={<Title level={4}>Hình ảnh</Title>} style={{ marginBottom: 16 }}>
                        <Space direction="vertical">
                            <Form.Item
                                name="thumbUrl"
                                label="Ảnh ngang (Thumb)"
                                rules={[
                                    { required: true, message: 'Ảnh ngang không được để trống' },
                                    { type: 'url', message: 'URL ảnh ngang phải hợp lệ' },
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
                                                Tải lên
                                            </Button>
                                        </Upload>
                                        {thumbUrl !== defaultThumbUrl && (
                                            <Button
                                                icon={<UndoOutlined />}
                                                onClick={() => restoreDefaultImage('thumb')}
                                            >
                                                Khôi phục
                                            </Button>
                                        )}
                                    </Space>
                                </Space>
                            </Form.Item>
                            {thumbUrl && (
                                <Image
                                    src={thumbUrl}
                                    alt="Ảnh ngang phim"
                                    style={{ width: '100%', marginBottom: 16 }}
                                />
                            )}
                            <Form.Item
                                name="posterUrl"
                                label="Ảnh dọc (Poster)"
                                rules={[{ type: 'url', message: 'URL ảnh dọc phải hợp lệ' }]}
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
                                                loading={isPosterLoading}
                                            >
                                                Tải lên
                                            </Button>
                                        </Upload>
                                        {posterUrl !== defaultPosterUrl && (
                                            <Button
                                                icon={<UndoOutlined />}
                                                onClick={() => restoreDefaultImage('poster')}
                                            >
                                                Khôi phục
                                            </Button>
                                        )}
                                    </Space>
                                </Space>
                            </Form.Item>
                            {posterUrl && (
                                <Image
                                    src={posterUrl}
                                    alt="Ảnh dọc phim"
                                    style={{ width: '100%', marginBottom: 16 }}
                                />
                            )}
                            <Form.Item
                                name="trailerUrl"
                                label="URL trailer"
                                rules={[{ type: 'url', message: 'URL trailer phải hợp lệ' }]}
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
