import { ApiPropertyOptional, IntersectionType, PartialType, PickType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { PaginationRequestDto } from 'apps/api/src/libs/dtos';
import { Movie } from '../movie.schema';

export class GetMoviesDto extends IntersectionType(
    PaginationRequestDto,
    PickType(PartialType(Movie), ['cinemaRelease', 'isCopyright', 'slug', 'type']),
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
}
