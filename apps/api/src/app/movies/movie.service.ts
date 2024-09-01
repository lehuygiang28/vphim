import { Injectable, Logger } from '@nestjs/common';
import { createRegex } from '@vn-utils/text';

import { MovieRepository } from './movie.repository';
import { GetMoviesDto } from './dtos';
import { FilterQuery, QueryOptions } from 'mongoose';
import { Movie } from './movie.schema';

@Injectable()
export class MovieService {
    private readonly logger: Logger;

    constructor(private readonly movieRepo: MovieRepository) {
        this.logger = new Logger(MovieService.name);
    }

    async getMovies(dto: GetMoviesDto) {
        const { keywords, cinemaRelease, isCopyright, type, year } = dto;
        const options: Partial<QueryOptions<Movie>> = {};

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

        const [movies, total] = await Promise.all([
            this.movieRepo.find({
                filterQuery: filters,
                queryOptions: options,
                query: dto,
            }),
            this.movieRepo.count(filters),
        ]);

        return {
            data: movies,
            total,
        };
    }
}
