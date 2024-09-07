import { Types } from 'mongoose';
import { Field, ID, ObjectType } from '@nestjs/graphql';

import { Region } from './region.schema';

@ObjectType('Region')
export class RegionType implements Region {
    @Field(() => ID)
    _id: Types.ObjectId;

    @Field()
    name: string;

    @Field()
    slug: string;

    @Field(() => Date)
    createdAt?: Date;

    @Field(() => Date)
    updatedAt?: Date;
}
