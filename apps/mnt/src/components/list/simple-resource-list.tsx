'use client';

import React from 'react';
import { BaseResourceList, BaseResourceListProps } from './base-resource-list';
import { CategoryType } from '~api/app/categories';
import { RegionType } from '~api/app/regions/region.type';

type SimpleResourceType = CategoryType | RegionType;

export function SimpleResourceList(
    props: Omit<BaseResourceListProps<SimpleResourceType>, 'columns'>,
) {
    return <BaseResourceList {...props} showImage={false} />;
}
