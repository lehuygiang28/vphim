'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Tooltip, Image as AntImage } from 'antd';
import { ColumnsType } from 'antd/es/table';

import { BaseResourceList, BaseResourceListProps } from './base-resource-list';
import { ActorType } from '~api/app/actors';
import { DirectorType } from '~api/app/directors/director.type';

type PersonType = ActorType | DirectorType;

export function PersonResourceList(props: Omit<BaseResourceListProps<PersonType>, 'columns'>) {
    const router = useRouter();

    const personColumns: ColumnsType<PersonType> = [
        {
            dataIndex: 'posterUrl',
            title: 'Image',
            render: (posterUrl: string, record: PersonType) => (
                <Tooltip title={record.name}>
                    <AntImage
                        src={posterUrl}
                        alt={record.name}
                        width={40}
                        height={60}
                        preview={false}
                        onClick={() =>
                            router.push(`/${props.resource}/edit/${record._id?.toString()}`)
                        }
                        style={{ cursor: 'pointer' }}
                    />
                </Tooltip>
            ),
        },
        {
            dataIndex: 'originalName',
            title: 'Original Name',
        },
    ];

    return <BaseResourceList<PersonType> {...props} columns={personColumns} showImage={true} />;
}
