import { Field, ObjectType } from '@nestjs/graphql';
import { CategoryType } from '../category.type';

@ObjectType('GetCategoriesOutput')
export class GetCategoriesOutput {
    @Field(() => [CategoryType])
    data: CategoryType[];

    @Field()
    total: number;
}
