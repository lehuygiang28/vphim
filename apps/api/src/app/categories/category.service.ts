import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { createRegex, removeDiacritics, removeTone } from '@vn-utils/text';

import { CategoryRepository } from './category.repository';
import { GetCategoriesInput } from './inputs/get-categories.input';
import { Category } from './category.schema';
import { convertToObjectId, sortedStringify } from '../../libs/utils/common';
import { RedisService } from '../../libs/modules/redis';
import { UpdateCategoryInput } from './inputs/update-category.input';
import { CreateCategoryInput } from './inputs/create-category.input';
import { GetCategoryInput } from './inputs/get-category.input';
import { DeleteCategoryInput } from './inputs/delete-category.input';

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

        if (query?.ids?.length) {
            filterQuery._id = { $in: query?.ids?.map((id) => convertToObjectId(id)) };
        }

        if (query?.slugs?.length) {
            filterQuery.slug = { $in: query.slugs };
        }

        const [data, total] = await Promise.all([
            this.categoryRepo.find({ filterQuery, query }),
            this.categoryRepo.count(filterQuery),
        ]);
        const result = { data, total };

        await this.redisService.set(cacheKey, result, 1000 * 10);
        return result;
    }

    async updateCategory({ _id, name }: UpdateCategoryInput) {
        return this.categoryRepo.findOneAndUpdateOrThrow({
            filterQuery: { _id: convertToObjectId(_id) },
            updateQuery: { name: name },
        });
    }

    async getCategory({ _id, slug }: GetCategoryInput) {
        if (_id) {
            return this.categoryRepo.findOneOrThrow({
                filterQuery: { _id: convertToObjectId(_id) },
            });
        }

        if (slug) {
            return this.categoryRepo.findOneOrThrow({
                filterQuery: { slug },
            });
        }

        throw new HttpException(
            {
                status: HttpStatus.UNPROCESSABLE_ENTITY,
                errors: {
                    _id: 'required',
                },
            },
            HttpStatus.UNPROCESSABLE_ENTITY,
        );
    }

    async createCategory({ name, slug }: CreateCategoryInput): Promise<Category> {
        const exists = await this.categoryRepo.findOne({ filterQuery: { slug } });

        if (exists) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        slug: 'alreadyExists',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        return this.categoryRepo.create({
            document: { name, slug: removeDiacritics(removeTone(slug)) },
        });
    }

    async deleteCategory({ _id }: DeleteCategoryInput) {
        await this.categoryRepo.deleteOne({ _id: convertToObjectId(_id) });
        return 1;
    }
}
