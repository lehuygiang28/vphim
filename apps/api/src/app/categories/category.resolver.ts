import { Resolver, Query, Args, Mutation, Int } from '@nestjs/graphql';

import { CategoryType } from './category.type';
import { CategoryService } from './category.service';
import { GetCategoriesInput } from './inputs/get-categories.input';
import { GetCategoriesOutput } from './outputs/get-categories.output';
import { GetCategoryInput } from './inputs/get-category.input';
import { UpdateCategoryInput } from './inputs/update-category.input';
import { RequiredRoles } from '../auth';
import { UserRoleEnum } from '../users';
import { CreateCategoryInput } from './inputs/create-category.input';
import { DeleteCategoryInput } from './inputs/delete-category.input';

@Resolver(() => CategoryType)
export class CategoryResolver {
    constructor(private readonly categoryService: CategoryService) {}

    @Query(() => GetCategoriesOutput, { name: 'categories' })
    async getCategories(@Args('input') input: GetCategoriesInput) {
        return this.categoryService.getCategories(input);
    }

    @Query(() => CategoryType, { name: 'category' })
    async getCategory(@Args('input') input: GetCategoryInput) {
        return this.categoryService.getCategory({ _id: input._id, slug: input.slug });
    }

    @RequiredRoles('admin' as UserRoleEnum, { isGql: true })
    @Mutation(() => CategoryType, { name: 'updateCategory' })
    async updateCategory(@Args('input') input: UpdateCategoryInput) {
        return this.categoryService.updateCategory(input);
    }

    @RequiredRoles('admin' as UserRoleEnum, { isGql: true })
    @Mutation(() => CategoryType, { name: 'createCategory' })
    async createCategory(
        @Args('input') { name, slug }: CreateCategoryInput,
    ): Promise<CategoryType> {
        return this.categoryService.createCategory({ name, slug });
    }

    @RequiredRoles('admin' as UserRoleEnum, { isGql: true })
    @Mutation(() => Int, { name: 'deleteCategory' })
    async deleteCategory(@Args('input') { _id }: DeleteCategoryInput) {
        return this.categoryService.deleteCategory({ _id });
    }
}
