import { Types } from 'mongoose';
import { Field, ID, ObjectType } from '@nestjs/graphql';

import { Region } from './region.schema';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType('Region')
export class RegionType implements Region {
    @ApiProperty({ example: '66ed6e981a05f01462e68bca', format: 'ObjectId' })
    @Field(() => ID)
    _id: Types.ObjectId;

    @ApiProperty()
    @Field()
    name: string;

    @ApiProperty()
    @Field()
    slug: string;

    @ApiProperty()
    @Field(() => Date)
    createdAt?: Date;

    @ApiProperty()
    @Field(() => Date)
    updatedAt?: Date;
}
