import { ApiPropertyOptional } from '@nestjs/swagger';
import { GetActorsInput } from '../inputs/get-actors.input';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetActorsDto implements GetActorsInput {
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
