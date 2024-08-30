import { Injectable, Logger } from '@nestjs/common';
import { createRegex } from '@vn-utils/text';

import { MovieRepository } from './movie.repository';
import { GetMoviesDto } from './dtos';
import { FilterQuery } from 'mongoose';
import { Movie } from './movie.schema';

@Injectable()
export class MovieService {
    private readonly logger: Logger;

    constructor(private readonly movieRepo: MovieRepository) {
        this.logger = new Logger(MovieService.name);
    }

    getMovies(dto: GetMoviesDto) {
        const { keywords, cinemaRelease, isCopyright, type, year } = dto;
        let filters: FilterQuery<Movie> = {
            ...(cinemaRelease && { cinemaRelease }),
            ...(isCopyright && { isCopyright }),
            ...(type && { type }),
            ...(year && { year }),
        };

        if (keywords) {
            const keywordRegex = createRegex(keywords, { outputCase: 'lowerAndUpper' });
            filters = {
                ...filters,
                $or: [
                    { name: keywordRegex },
                    { originName: keywordRegex },
                    { content: keywordRegex },
                    { slug: keywordRegex },
                ],
            };
        }

        return this.movieRepo.find({
            filterQuery: filters,
            query: dto,
        });
    }
}
