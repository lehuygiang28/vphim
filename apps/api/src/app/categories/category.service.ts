import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { createRegex } from '@vn-utils/text';

import { CategoryRepository } from './category.repository';
import { UpdateCategoryDto } from './dtos';
import { GetCategoriesInput } from './inputs/get-categories.input';
import { Category } from './category.schema';
import { sortedStringify } from '../../libs/utils/common';
import { RedisService } from '../../libs/modules/redis';

@Injectable()
export class CategoryService {
    private readonly logger: Logger;

    constructor(
        private readonly categoryRepo: CategoryRepository,
        private readonly redisService: RedisService,
    ) {
        this.logger = new Logger(CategoryService.name);
    }

    async getCategories(query?: GetCategoriesInput) {
        const cacheKey = `CACHED:CATEGORIES:${sortedStringify(query)}`;

        const fromCache = await this.redisService.get(cacheKey);
        if (fromCache) {
            return fromCache;
        }

        const { keywords } = query;
        const filterQuery: FilterQuery<Category> = {};

        if (keywords) {
            const regex = createRegex(keywords);
            filterQuery.$or = [{ name: regex }, { slug: regex }, { content: regex }];
        }

        const [data, total] = await Promise.all([
            this.categoryRepo.find({ filterQuery, query }),
            this.categoryRepo.count(filterQuery),
        ]);
        const result = { data, total };

        await this.redisService.set(cacheKey, result, 1000 * 10);
        return result;
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
