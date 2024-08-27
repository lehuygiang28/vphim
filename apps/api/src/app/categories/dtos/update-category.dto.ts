import { ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Category } from '../category.schema';

export class UpdateCategoryDto extends PickType(Category, ['name']) {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name: string;
}
