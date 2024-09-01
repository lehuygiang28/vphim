import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { PaginationResponseDto } from '../../../libs/dtos';
import { Movie } from '../movie.schema';

export class GetMoviesResponseDto extends IntersectionType(PaginationResponseDto<Movie>) {
    @ApiProperty({ type: [Movie] })
    data: Movie[];
}
