import { ApiPropertyOptional, IntersectionType, PartialType, PickType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { PaginationRequestDto } from 'apps/api/src/libs/dtos';
import { Movie } from '../movie.schema';

export class GetMoviesDto extends IntersectionType(
    PaginationRequestDto,
    PickType(PartialType(Movie), ['cinemaRelease', 'isCopyright', 'slug', 'type', 'year']),
) {
    @ApiPropertyOptional({ example: 'One piece' })
    @IsOptional()
    @IsString()
    keywords?: string;
}
