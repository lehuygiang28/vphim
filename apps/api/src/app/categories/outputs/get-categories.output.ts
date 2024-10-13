import { Field, ObjectType } from '@nestjs/graphql';
import { CategoryType } from '../category.type';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType('GetCategoriesOutput')
export class GetCategoriesOutput {
    @ApiProperty({ type: [CategoryType], description: 'List of categories' })
    @Field(() => [CategoryType])
    data: CategoryType[];

    @ApiProperty({ type: Number, description: 'Number of categories returned' })
    @Field()
    count: number;

    @ApiProperty({ type: Number, description: 'Total number of categories' })
    @Field()
    total: number;
}
