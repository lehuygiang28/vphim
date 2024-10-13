import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CategoryService } from './category.service';
import { GetCategoriesDto } from './dtos';
import { GetCategoriesOutput } from './outputs/get-categories.output';

@ApiTags('categories')
@Controller({
    path: '/categories',
})
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @ApiOperation({ summary: 'Get categories', description: 'Get list of categories' })
    @ApiOkResponse({ type: GetCategoriesOutput })
    @Throttle({ default: { limit: 10, ttl: 10000 } })
    @Get('/')
    async getCategories(@Query() query: GetCategoriesDto) {
        return this.categoryService.getCategories(query);
    }
}
