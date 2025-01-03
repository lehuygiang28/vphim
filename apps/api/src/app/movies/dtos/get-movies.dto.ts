import { ApiPropertyOptional, IntersectionType, PartialType, PickType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

import { PaginationRequestDto } from 'apps/api/src/libs/dtos';
import { isTrue } from 'apps/api/src/libs/utils/common';
import { Movie } from '../movie.schema';
import { KEYWORDS_MAX_LENGTH } from '../movie.constant';

export class GetMoviesDto extends IntersectionType(
    PaginationRequestDto,
    PickType(PartialType(Movie), ['cinemaRelease', 'isCopyright', 'slug', 'type', 'status']),
) {
    @ApiPropertyOptional({ example: 'One piece' })
    @IsOptional()
    @IsString()
    @MaxLength(KEYWORDS_MAX_LENGTH)
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
