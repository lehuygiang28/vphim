import { Injectable, Logger } from '@nestjs/common';
import { FilterQuery, PipelineStage } from 'mongoose';
import { createRegex } from '@vn-utils/text';

import { MovieRepository } from './movie.repository';
import { GetMoviesDto, MovieResponseDto } from './dtos';
import { Movie } from './movie.schema';
import { isNullOrUndefined } from '../../libs/utils/common';

@Injectable()
export class MovieService {
    private readonly logger: Logger;

    constructor(private readonly movieRepo: MovieRepository) {
        this.logger = new Logger(MovieService.name);
    }

    async getMovies(dto: GetMoviesDto) {
        const {
            keywords,
            cinemaRelease,
            isCopyright,
            type,
            years,
            categories,
            countries,
            limit = 10,
            page = 1,
            sortBy = 'year',
            sortOrder = 'asc',
        } = dto;

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
        ];

        const match: FilterQuery<Movie> = {};

        if (keywords) {
            const keywordRegex = createRegex(keywords, { outputCase: 'lowerAndUpper' });
            match.$or = [
                { name: { $regex: keywordRegex } },
                { originName: { $regex: keywordRegex } },
                { content: { $regex: keywordRegex } },
                { slug: { $regex: keywordRegex } },
                { 'categories.name': { $regex: keywordRegex } },
                { 'countries.name': { $regex: keywordRegex } },
                { 'actors.name': { $regex: keywordRegex } },
                { 'directors.name': { $regex: keywordRegex } },
            ];
        }

        if (cinemaRelease !== undefined) {
            match.cinemaRelease = cinemaRelease;
        }

        if (isCopyright !== undefined) {
            match.isCopyright = isCopyright;
        }

        if (type) {
            match.type = type;
        }

        if (years) {
            match.year = {
                $in: years
                    .split(',')
                    .map((year) => !isNullOrUndefined(year) && Number(year.trim())),
            };
        }

        if (categories) {
            match['categories.slug'] = {
                $in: categories
                    .split(',')
                    .filter((c) => !isNullOrUndefined(c))
                    .map((c) => c.trim()),
            };
        }

        if (countries) {
            match['countries.slug'] = {
                $in: countries
                    .split(',')
                    .filter((c) => !isNullOrUndefined(c))
                    .map((c) => c.trim()),
            };
        }

        pipeline.push({ $match: match });

        pipeline.push(
            {
                $facet: {
                    movies: [
                        { $sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 } },
                        { $skip: (page - 1) * limit },
                        { $limit: Number(limit) },
                        { $project: { __v: 0, episode: 0 } },
                    ],
                    total: [{ $count: 'count' }],
                },
            },
            { $project: { movies: 1, total: { $arrayElemAt: ['$total.count', 0] } } },
        );

        const result = (await this.movieRepo.aggregate<
            {
                movies: Movie[];
                total: number;
            }[]
        >(pipeline)) as { movies: Movie[]; total: number }[];
        const movies = result?.[0]?.movies?.map((movie) => new MovieResponseDto(movie));
        const total = result?.[0]?.total || 0;

        return {
            data: movies,
            total,
        };
    }
}
