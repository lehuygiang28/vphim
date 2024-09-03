import { Injectable, Logger } from '@nestjs/common';
import { FilterQuery, PipelineStage } from 'mongoose';
import { createRegex } from '@vn-utils/text';

import { MovieRepository } from './movie.repository';
import { GetMoviesDto } from './dtos';
import { Movie } from './movie.schema';

@Injectable()
export class MovieService {
    private readonly logger: Logger;

    constructor(private readonly movieRepo: MovieRepository) {
        this.logger = new Logger(MovieService.name);
    }

    async getMovies(dto: GetMoviesDto) {
        const { keywords, cinemaRelease, isCopyright, type, years, categories, countries } = dto;

        let filters: FilterQuery<Movie> = {
            ...(cinemaRelease && { cinemaRelease }),
            ...(isCopyright && { isCopyright }),
            ...(type && { type }),
            ...(years && { year: { $in: years?.split(',').map((year) => Number(year)) } }),
        };

        const keywordFilters = [];
        if (keywords) {
            const keywordRegex = createRegex(keywords, { outputCase: 'lowerAndUpper' });
            keywordFilters.push({ name: keywordRegex });
            keywordFilters.push({ originName: keywordRegex });
            keywordFilters.push({ content: keywordRegex });
            keywordFilters.push({ slug: keywordRegex });
            keywordFilters.push({ 'categories.name': keywordRegex });
            keywordFilters.push({ 'countries.name': keywordRegex });
            keywordFilters.push({ 'actors.name': keywordRegex });
            keywordFilters.push({ 'directors.name': keywordRegex });
        }

        if (keywordFilters.length > 0) {
            filters = { ...filters, $or: keywordFilters };
        }

        const pipeline: PipelineStage[] = [
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categories',
                    foreignField: '_id',
                    as: 'categories',
                    pipeline: [
                        {
                            $project: { _id: 1, name: 1, slug: 1 },
                        },
                    ],
                },
            },
            {
                $lookup: {
                    from: 'regions',
                    localField: 'countries',
                    foreignField: '_id',
                    as: 'countries',
                    pipeline: [
                        {
                            $project: { _id: 1, name: 1, slug: 1 },
                        },
                    ],
                },
            },
            {
                $lookup: {
                    from: 'actors',
                    localField: 'actors',
                    foreignField: '_id',
                    as: 'actors',
                    pipeline: [
                        {
                            $project: { _id: 1, name: 1, slug: 1 },
                        },
                    ],
                },
            },
            {
                $lookup: {
                    from: 'directors',
                    localField: 'directors',
                    foreignField: '_id',
                    as: 'directors',
                    pipeline: [
                        {
                            $project: { _id: 1, name: 1, slug: 1 },
                        },
                    ],
                },
            },
            {
                $match: {
                    ...filters,
                    ...(keywordFilters.length > 0 && { $or: keywordFilters }),
                    ...(categories?.length > 0 && {
                        'categories.slug': { $in: categories?.split(',') },
                    }),
                    ...(countries?.length > 0 && {
                        'countries.slug': { $in: countries?.split(',') },
                    }),
                },
            },
            { $sort: { [dto?.sortBy || 'year']: dto?.sortOrder === 'asc' ? 1 : -1 } },
            {
                $facet: {
                    movies: [
                        { $project: { __v: 0, episode: 0 } },
                        { $skip: (dto.page - 1) * dto.limit },
                        { $limit: Number(dto.limit) },
                    ],
                    total: [{ $count: 'count' }],
                },
            },
            { $project: { movies: 1, total: { $arrayElemAt: ['$total.count', 0] } } },
        ];

        const result = (await this.movieRepo.aggregate<
            {
                movies: Movie[];
                total: number;
            }[]
        >(pipeline)) as { movies: Movie[]; total: number }[];
        const movies = result?.[0]?.movies;
        const total = result?.[0]?.total;

        return {
            data: movies,
            total,
        };
    }
}
