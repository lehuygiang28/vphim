import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CategoryService } from './category.service';
import { GetCategoriesDto } from './dtos';

@ApiTags('categories')
@Controller({
    path: '/categories',
})
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @Throttle({ default: { limit: 10, ttl: 10000 } })
    @Get('/')
    async getCategories(@Query() query: GetCategoriesDto) {
        return this.categoryService.getCategories(query);
    }
}
