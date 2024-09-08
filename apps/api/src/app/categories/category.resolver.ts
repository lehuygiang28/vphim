import { Resolver, Query, Args } from '@nestjs/graphql';

import { CategoryType } from './category.type';
import { CategoryService } from './category.service';
import { GetCategoriesInput } from './inputs/get-categories.input';
import { GetCategoriesOutput } from './outputs/get-categories.output';

@Resolver(() => CategoryType)
export class CategoryResolver {
    constructor(private readonly categoryService: CategoryService) {}

    @Query(() => GetCategoriesOutput, { name: 'categories' })
    async getCategories(@Args('input') input: GetCategoriesInput) {
        return this.categoryService.getCategories(input);
    }
}
