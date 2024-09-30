import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CategoryService } from './category.service';

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
}
