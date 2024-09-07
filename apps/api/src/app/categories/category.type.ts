import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { Category } from './category.schema';

@ObjectType('Category')
export class CategoryType implements Category {
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
