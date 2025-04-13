import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Movie } from '../movie.schema';
import { Actor } from '../../actors/actor.schema';
import { Category } from '../../categories/category.schema';
import { Region } from '../../regions/region.schema';
import { Director } from '../../directors/director.schema';
import { MovieContentRatingEnum } from '../movie.constant';

export class MovieResponseDto extends OmitType(Movie, [
    'actors',
    'categories',
    'countries',
    'directors',
]) {
    constructor(movie: Movie, options?: { excludeSrc?: ('ophim' | 'kkphim' | 'nguonc')[] }) {
        super(movie);
        Object.assign(this, movie);
        this.posterUrl = movie?.posterUrl || '';
        this.thumbUrl = movie?.thumbUrl || '';
        this.actors = (movie?.actors as unknown as Actor[]) || [];
        this.categories = (movie?.categories as unknown as Category[]) || [];
        this.countries = (movie?.countries as unknown as Region[]) || [];
        this.directors = (movie?.directors as unknown as Director[]) || [];
        this.contentRating = movie?.contentRating || MovieContentRatingEnum.P;

        if (options?.excludeSrc) {
            const excludeSources = options.excludeSrc;
            this.episode =
                movie.episode?.filter(
                    (ep) => !(excludeSources as string[]).includes(ep?.originSrc),
                ) || [];
        }
    }

    @ApiProperty({ type: [Actor] })
    actors?: Actor[];

    @ApiProperty({ type: [Category] })
    categories?: Category[];

    @ApiProperty({ type: [Region] })
    countries?: Region[];

    @ApiProperty({ type: [Director] })
    directors?: Director[];

    @ApiProperty({ type: String, enum: MovieContentRatingEnum })
    contentRating: MovieContentRatingEnum;
}
