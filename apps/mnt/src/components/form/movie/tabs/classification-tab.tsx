import { useList } from '@refinedev/core';
import { Card, Form, Select } from 'antd';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { ActorType } from '~api/app/actors';
import { CategoryType } from '~api/app/categories';
import { GET_ACTOR_LIST_QUERY } from '~mnt/queries/actor.query';
import { MNT_CATEGORIES_LIST_QUERY } from '~mnt/queries/category.query';

const { Option } = Select;

export type ClassificationTabProps = {
    defaultActors: ActorType[];
    defaultCategories: CategoryType[];
};

export function ClassificationTab({ defaultActors, defaultCategories }: ClassificationTabProps) {
    const [actorSearch, setActorSearch] = useState('');
    const [categorySearch, setCategorySearch] = useState('');
    const [debouncedActorSearch] = useDebounce(actorSearch, 300);
    const [debouncedCategorySearch] = useDebounce(categorySearch, 300);
    const [selectedActors, setSelectedActors] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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

    const handleActorSearch = (value: string) => {
        setActorSearch(value);
    };

    const handleCategorySearch = (value: string) => {
        setCategorySearch(value);
    };

    useEffect(() => {
        refetchActors();
    }, [debouncedActorSearch, refetchActors]);

    useEffect(() => {
        refetchCategories();
    }, [debouncedCategorySearch, refetchCategories]);

    useEffect(() => {
        if (defaultActors) {
            setSelectedActors(
                defaultActors?.map((actor: ActorType) => actor._id?.toString()) || [],
            );
        }
    }, [defaultActors]);

    useEffect(() => {
        if (defaultActors) {
            setSelectedCategories(
                defaultActors?.map((category: CategoryType) => category._id?.toString()) || [],
            );
        }
    }, [defaultActors]);

    return (
        <Card title="Classification" style={{ marginTop: 16 }} bordered={false}>
            <Form.Item label="Actors" name={['actors', '_id']}>
                <Select
                    mode="multiple"
                    showSearch
                    placeholder="Search for actors"
                    defaultActiveFirstOption={false}
                    suffixIcon={null}
                    filterOption={false}
                    onSearch={handleActorSearch}
                    loading={isActorsLoading}
                    value={selectedActors}
                    onChange={(values) => setSelectedActors(values)}
                    defaultValue={defaultActors?.map((category) => category._id?.toString())}
                >
                    {[...(defaultActors || []), ...(actorsData?.data || [])]
                        .filter(
                            (actor, index, self) =>
                                index === self.findIndex((t) => t._id === actor._id),
                        )
                        .map((actor: ActorType) => (
                            <Option
                                key={actor._id?.toString()}
                                value={actor._id}
                                label={`${actor.name} (${actor.slug})`}
                            >
                                {`${actor.name} (${actor.slug})`}
                            </Option>
                        ))}
                </Select>
            </Form.Item>

            <Form.Item label="Categories" name={['categories', '_id']}>
                <Select
                    mode="multiple"
                    placeholder="Search for categories"
                    defaultActiveFirstOption={false}
                    suffixIcon={null}
                    filterOption={false}
                    onSearch={handleCategorySearch}
                    loading={isCategoriesLoading}
                    value={selectedCategories}
                    onChange={(values) => setSelectedCategories(values)}
                    defaultValue={defaultCategories?.map((category) => category._id?.toString())}
                >
                    {[...(defaultCategories || []), ...(categoriesData?.data || [])]
                        .filter(
                            (category, index, self) =>
                                index === self.findIndex((t) => t._id === category._id),
                        )
                        .map((category: CategoryType) => (
                            <Option
                                key={category._id?.toString()}
                                value={category._id}
                                label={`${category.name} (${category.slug})`}
                            >
                                {`${category.name} (${category.slug})`}
                            </Option>
                        ))}
                </Select>
            </Form.Item>
        </Card>
    );
}
