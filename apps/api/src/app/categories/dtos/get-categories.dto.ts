import { ApiPropertyOptional } from '@nestjs/swagger';
import { GetCategoriesInput } from '../inputs/get-categories.input';
import {
    IsMongoId,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GetCategoriesDto implements GetCategoriesInput {
    @ApiPropertyOptional()
    @IsOptional()
    @IsMongoId()
    @ValidateNested({ each: true })
    ids?: string[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @ValidateNested({ each: true })
    slugs?: string[];

    @IsOptional()
    @ApiPropertyOptional()
    @IsString()
    keywords?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(50)
    limit?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(Number.MAX_SAFE_INTEGER)
    page?: number;
}
