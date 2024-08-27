import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { CategoryRepository } from './category.repository';
import { UpdateCategoryDto } from './dtos';

@Injectable()
export class CategoryService {
    private readonly logger: Logger;

    constructor(private readonly categoryRepo: CategoryRepository) {
        this.logger = new Logger(CategoryService.name);
    }

    async getCategories() {
        return this.categoryRepo.find({ filterQuery: {} });
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
