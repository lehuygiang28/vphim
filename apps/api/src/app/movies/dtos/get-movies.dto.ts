import { ApiPropertyOptional, IntersectionType, PartialType, PickType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

import { PaginationRequestDto } from 'apps/api/src/libs/dtos';
import { Movie } from '../movie.schema';
import { Transform } from 'class-transformer';
import { isTrue } from 'apps/api/src/libs/utils/common';

export class GetMoviesDto extends IntersectionType(
    PaginationRequestDto,
    PickType(PartialType(Movie), ['cinemaRelease', 'isCopyright', 'slug', 'type', 'status']),
) {
    @ApiPropertyOptional({ example: 'One piece' })
    @IsOptional()
    @IsString()
    keywords?: string;

    @ApiPropertyOptional({ type: String, example: 'hanh-dong, hoat-hinh' })
    @IsOptional()
    @IsString()
    categories?: string;

    @ApiPropertyOptional({ type: String, example: 'viet-nam, han-quoc' })
    @IsOptional()
    @IsString()
    countries?: string;

    @ApiPropertyOptional({ type: String, example: '2024, 2023, 2022' })
    @IsOptional()
    @IsString()
    years: string;

    @ApiPropertyOptional({ type: Boolean, example: true })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => isTrue(value))
    resetCache?: boolean;
}
