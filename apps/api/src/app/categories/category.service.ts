import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { CategoryRepository } from './category.repository';
import { UpdateCategoryDto } from './dtos';
import { GetCategoriesInput } from './inputs/get-categories.input';
import { FilterQuery } from 'mongoose';
import { Category } from './category.schema';

@Injectable()
export class CategoryService {
    private readonly logger: Logger;

    constructor(private readonly categoryRepo: CategoryRepository) {
        this.logger = new Logger(CategoryService.name);
    }

    async getCategories(query?: GetCategoriesInput) {
        const filterQuery: FilterQuery<Category> = {};

        const [data, total] = await Promise.all([
            this.categoryRepo.find({ filterQuery, query }),
            this.categoryRepo.count(filterQuery),
        ]);

        return { data, total };
    }

    async updateCategory({ slug, body }: { slug: string; body: UpdateCategoryDto }) {
        if (Object.keys(body)?.length === 0) {
            throw new BadRequestException({
                errors: {
                    body: 'No data to update',
                },
                message: 'No data to update',
            });
        }

        return this.categoryRepo.findOneAndUpdateOrThrow({
            filterQuery: { slug },
            updateQuery: { name: body?.name },
        });
    }
}
