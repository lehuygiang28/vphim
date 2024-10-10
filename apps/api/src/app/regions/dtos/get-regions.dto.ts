import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { GetRegionsInput } from '../inputs/get-regions.input';

export class GetRegionsDto implements GetRegionsInput {
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
