import { useList } from '@refinedev/core';
import { Card, Form, FormProps, Select } from 'antd';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { ActorType } from '~api/app/actors';
import { CategoryType } from '~api/app/categories';
import { DirectorType } from '~api/app/directors/director.type';
import { RegionType } from '~api/app/regions/region.type';
import { GET_ACTOR_LIST_QUERY } from '~mnt/queries/actor.query';
import { MNT_CATEGORIES_LIST_QUERY } from '~mnt/queries/category.query';
import { GET_DIRECTOR_LIST_QUERY } from '~mnt/queries/director.query';
import { MNT_REGIONS_LIST_QUERY } from '~mnt/queries/region.query';

const { Option } = Select;

export type ClassificationTabProps = {
    formProps: FormProps<unknown>;
    defaultActors?: ActorType[];
    defaultCategories?: CategoryType[];
    defaultCountries?: RegionType[];
    defaultDirectors?: DirectorType[];
};

export function ClassificationTab({
    formProps,
    defaultActors,
    defaultCategories,
    defaultCountries,
    defaultDirectors,
}: ClassificationTabProps) {
    const [actorSearch, setActorSearch] = useState('');
    const [categorySearch, setCategorySearch] = useState('');
    const [countrySearch, setCountrySearch] = useState('');
    const [directorSearch, setDirectorSearch] = useState('');
    const [debouncedActorSearch] = useDebounce(actorSearch, 300);
    const [debouncedCategorySearch] = useDebounce(categorySearch, 300);
    const [debouncedCountrySearch] = useDebounce(countrySearch, 300);
    const [debouncedDirectorSearch] = useDebounce(directorSearch, 300);

    const {
        data: actorsData,
        refetch: refetchActors,
        isLoading: isActorsLoading,
    } = useList<ActorType>({
        dataProviderName: 'graphql',
        resource: 'actors',
        meta: {
            gqlQuery: GET_ACTOR_LIST_QUERY,
            operation: 'actors',
        },
        filters: [
            {
                field: 'keywords',
                operator: 'contains',
                value: debouncedActorSearch,
            },
        ],
        pagination: {
            pageSize: 20,
        },
    });

    const {
        data: categoriesData,
        refetch: refetchCategories,
        isLoading: isCategoriesLoading,
    } = useList<CategoryType>({
        dataProviderName: 'graphql',
        resource: 'categories',
        meta: {
            gqlQuery: MNT_CATEGORIES_LIST_QUERY,
            operation: 'categories',
        },
        filters: [
            {
                field: 'keywords',
                operator: 'contains',
                value: debouncedCategorySearch,
            },
        ],
        pagination: {
            pageSize: 20,
        },
    });

    const {
        data: countriesData,
        refetch: refetchCountries,
        isLoading: isCountriesLoading,
    } = useList<RegionType>({
        dataProviderName: 'graphql',
        resource: 'regions',
        meta: {
            gqlQuery: MNT_REGIONS_LIST_QUERY,
            operation: 'regions',
        },
        filters: [
            {
                field: 'keywords',
                operator: 'contains',
                value: debouncedCountrySearch,
            },
        ],
        pagination: {
            pageSize: 20,
        },
    });

    const {
        data: directorsData,
        refetch: refetchDirectors,
        isLoading: isDirectorsLoading,
    } = useList<DirectorType>({
        dataProviderName: 'graphql',
        resource: 'directors',
        meta: {
            gqlQuery: GET_DIRECTOR_LIST_QUERY,
            operation: 'directors',
        },
        filters: [
            {
                field: 'keywords',
                operator: 'contains',
                value: debouncedDirectorSearch,
            },
        ],
        pagination: {
            pageSize: 20,
        },
    });

    const handleActorSearch = (value: string) => {
        setActorSearch(value);
    };

    const handleCategorySearch = (value: string) => {
        setCategorySearch(value);
    };

    const handleCountrySearch = (value: string) => {
        setCountrySearch(value);
    };

    const handleDirectorSearch = (value: string) => {
        setDirectorSearch(value);
    };

    useEffect(() => {
        refetchActors();
    }, [debouncedActorSearch, refetchActors]);

    useEffect(() => {
        refetchCategories();
    }, [debouncedCategorySearch, refetchCategories]);

    useEffect(() => {
        refetchCountries();
    }, [debouncedCountrySearch, refetchCountries]);

    useEffect(() => {
        refetchDirectors();
    }, [debouncedDirectorSearch, refetchDirectors]);

    useEffect(() => {
        if (defaultActors) {
            formProps?.form.setFieldsValue({
                actors: defaultActors.map((actor: ActorType) => actor._id?.toString()),
            });
        }
    }, [defaultActors, formProps]);

    useEffect(() => {
        if (defaultCategories) {
            formProps?.form.setFieldsValue({
                categories: defaultCategories.map((category: CategoryType) =>
                    category._id?.toString(),
                ),
            });
        }
    }, [defaultCategories, formProps]);

    useEffect(() => {
        if (defaultCountries) {
            formProps?.form.setFieldsValue({
                countries: defaultCountries.map((country: RegionType) => country._id?.toString()),
            });
        }
    }, [defaultCountries, formProps]);

    useEffect(() => {
        if (defaultDirectors) {
            formProps?.form.setFieldsValue({
                directors: defaultDirectors.map((director: DirectorType) =>
                    director._id?.toString(),
                ),
            });
        }
    }, [defaultDirectors, formProps]);

    return (
        <Card title="Classification" style={{ marginTop: 16 }} bordered={false}>
            <Form.Item name="actors" label="Actors">
                <Select
                    mode="multiple"
                    showSearch
                    placeholder="Search for actors"
                    defaultActiveFirstOption={false}
                    suffixIcon={null}
                    filterOption={false}
                    onSearch={handleActorSearch}
                    loading={isActorsLoading}
                    onChange={(values) => formProps?.form.setFieldsValue({ actors: values })}
                >
                    {[...(defaultActors || []), ...(actorsData?.data || [])]
                        .filter(
                            (actor, index, self) =>
                                index === self.findIndex((t) => t._id === actor._id),
                        )
                        .map((actor: ActorType) => (
                            <Option
                                key={actor._id?.toString()}
                                value={actor._id?.toString()}
                                label={`${actor.name} (${actor.slug})`}
                            >
                                {`${actor.name} (${actor.slug})`}
                            </Option>
                        ))}
                </Select>
            </Form.Item>

            <Form.Item name="directors" label="Directors">
                <Select
                    mode="multiple"
                    placeholder="Search for directors"
                    defaultActiveFirstOption={false}
                    suffixIcon={null}
                    filterOption={false}
                    onSearch={handleDirectorSearch}
                    loading={isDirectorsLoading}
                    onChange={(values) => formProps?.form.setFieldsValue({ directors: values })}
                >
                    {[...(defaultDirectors || []), ...(directorsData?.data || [])]
                        .filter(
                            (director, index, self) =>
                                index === self.findIndex((t) => t._id === director._id),
                        )
                        .map((director: DirectorType) => (
                            <Option
                                key={director._id?.toString()}
                                value={director._id?.toString()}
                                label={`${director.name} (${director.slug})`}
                            >
                                {`${director.name} (${director.slug})`}
                            </Option>
                        ))}
                </Select>
            </Form.Item>

            <Form.Item name="categories" label="Categories">
                <Select
                    mode="multiple"
                    placeholder="Search for categories"
                    defaultActiveFirstOption={false}
                    suffixIcon={null}
                    filterOption={false}
                    onSearch={handleCategorySearch}
                    loading={isCategoriesLoading}
                    onChange={(values) => formProps?.form.setFieldsValue({ categories: values })}
                >
                    {[...(defaultCategories || []), ...(categoriesData?.data || [])]
                        .filter(
                            (category, index, self) =>
                                index === self.findIndex((t) => t._id === category._id),
                        )
                        .map((category: CategoryType) => (
                            <Option
                                key={category._id?.toString()}
                                value={category._id?.toString()}
                                label={`${category.name} (${category.slug})`}
                            >
                                {`${category.name} (${category.slug})`}
                            </Option>
                        ))}
                </Select>
            </Form.Item>

            <Form.Item name="countries" label="Countries">
                <Select
                    mode="multiple"
                    placeholder="Search for countries"
                    defaultActiveFirstOption={false}
                    suffixIcon={null}
                    filterOption={false}
                    onSearch={handleCountrySearch}
                    loading={isCountriesLoading}
                    onChange={(values) => formProps?.form.setFieldsValue({ countries: values })}
                >
                    {[...(defaultCountries || []), ...(countriesData?.data || [])]
                        .filter(
                            (country, index, self) =>
                                index === self.findIndex((t) => t._id === country._id),
                        )
                        .map((country: RegionType) => (
                            <Option
                                key={country._id?.toString()}
                                value={country._id?.toString()}
                                label={`${country.name} (${country.slug})`}
                            >
                                {`${country.name} (${country.slug})`}
                            </Option>
                        ))}
                </Select>
            </Form.Item>
        </Card>
    );
}
