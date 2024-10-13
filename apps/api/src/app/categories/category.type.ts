import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { Category } from './category.schema';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType('Category')
export class CategoryType implements Category {
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
