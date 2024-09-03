import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Movie } from '../movie.schema';
import { Actor } from '../../actors/actor.schema';
import { Category } from '../../categories/category.schema';
import { Region } from '../../regions/region.schema';
import { Director } from '../../directors/director.schema';

export class MovieResponseDto extends OmitType(Movie, [
    'actors',
    'categories',
    'countries',
    'directors',
]) {
    @ApiProperty({ type: [Actor] })
    actors: Actor[];

    @ApiProperty({ type: [Category] })
    categories: Category[];

    @ApiProperty({ type: [Region] })
    countries: Region[];

    @ApiProperty({ type: [Director] })
    directors: Director[];
}
