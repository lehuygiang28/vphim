import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class PaginationRequestDto {
    @ApiPropertyOptional({ description: 'Sort by field', example: 'createdAt' })
    @IsOptional()
    @IsString()
    sortBy?: string;

    @ApiPropertyOptional({ description: 'Sort order (asc or desc)', example: 'asc' })
    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc';

    @ApiPropertyOptional({ description: 'Page number', default: 1 })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Number of items per page', default: 5 })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    limit?: number = 5;
}
