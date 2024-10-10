import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { GetDirectorsInput } from '../inputs/get-directors.input';

export class GetDirectorsDto implements GetDirectorsInput {
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
