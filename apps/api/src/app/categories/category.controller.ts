import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CategoryService } from './category.service';
import { SlugParamDto } from '../../libs/dtos';
import { UpdateCategoryDto } from './dtos';

@ApiTags('categories')
@Controller({
    path: '/categories',
})
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @Get('/')
    async getCategories() {
        return this.categoryService.getCategories();
    }

    @Patch('/:slug')
    async updateCategory(@Param() { slug }: SlugParamDto, @Body() body: UpdateCategoryDto) {
        return this.categoryService.updateCategory({ slug, body });
    }
}
