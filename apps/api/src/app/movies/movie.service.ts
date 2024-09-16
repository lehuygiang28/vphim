import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { FilterQuery, PipelineStage } from 'mongoose';
import { createRegex } from '@vn-utils/text';

import { MovieRepository } from './movie.repository';
import { GetMoviesDto, MovieResponseDto } from './dtos';
import { Movie } from './movie.schema';
import { isNullOrUndefined, sortedStringify } from '../../libs/utils/common';
import { RedisService } from '../../libs/modules/redis/services';
import { RatingResultType } from './rating-result.type';
import { GetRatingOutput } from './outputs/get-rating.output';

@Injectable()
export class MovieService {
    private readonly logger: Logger;

    constructor(
        private readonly movieRepo: MovieRepository,
        private readonly redisService: RedisService,
        private readonly httpService: HttpService,
    ) {
        this.logger = new Logger(MovieService.name);
    }

    async getMovie(slug: string, { populate = true }: { populate?: boolean } = {}) {
        const movie = await this.movieRepo.findOneOrThrow({
            filterQuery: { slug },
            queryOptions: {
                ...(populate && {
                    populate: [
                        {
                            path: 'actors',
                            justOne: false,
                        },
                        {
                            path: 'categories',
                            justOne: false,
                        },
                        {
                            path: 'countries',
                            justOne: false,
                        },
                        {
                            path: 'directors',
                            justOne: false,
                        },
                    ],
                }),
            },
        });
        return new MovieResponseDto(movie);
    }

    async getMovies(dto: GetMoviesDto) {
        const { resetCache } = dto;
        const cacheKey = `CACHED:MOVIES:${sortedStringify(dto)}`;

        if (resetCache) {
            await this.redisService.del(cacheKey);
        } else {
            const fromCache = await this.redisService.get(cacheKey);
            if (fromCache) {
                this.logger.debug(`CACHE: ${cacheKey}`);
                return fromCache;
            }
        }

        this.logger.debug(`DB: ${cacheKey}`);

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

        const res = {
            data: movies,
            total,
        };
        await this.redisService.set(cacheKey, res, 1000 * 60 * 60);
        return res;
    }

    async getRating(movieSlug: string): Promise<GetRatingOutput> {
        const movie = await this.movieRepo.findOneOrThrow({ filterQuery: { slug: movieSlug } });
        const result: GetRatingOutput = {
            imdb: {},
            tmdb: {},
        };
        const headers = {
            accept: 'application/json',
            Authorization: `Bearer ${process?.env?.TMDB_TOKEN}`,
        };

        if (movie?.imdb?.id) {
            result.imdb = { id: movie?.imdb?.id };
            const res = await this.httpService.axiosRef.get(
                `https://api.themoviedb.org/3/find/${movie?.imdb?.id}?external_source=imdb_id`,
                {
                    headers,
                },
            );
            const imdbResult = this.extractRatingFromImdbData(res?.data);
            if (imdbResult) {
                result.imdb = { id: movie?.imdb?.id, ...imdbResult };
            }
        }

        if (movie?.tmdb?.id) {
            result.tmdb = { id: movie?.tmdb?.id };
            const res = await this.httpService.axiosRef.get(
                `https://api.themoviedb.org/3/movie/${movie?.tmdb?.id}?language=en-US`,
                {
                    headers,
                },
            );
            result.tmdb = {
                id: movie?.tmdb?.id,
                voteAverage: res?.data?.vote_average || 0,
                voteCount: res?.data?.vote_count || 0,
            };
        }

        return result;
    }

    private extractRatingFromImdbData(imdbData: unknown): RatingResultType | null {
        const resultTypes = [
            'movie_results',
            'tv_results',
            'person_results',
            'tv_episode_results',
            'tv_season_results',
        ];

        for (const type of resultTypes) {
            if (imdbData[type] && imdbData[type].length > 0) {
                const result = imdbData[type][0];
                if (result?.vote_average !== undefined && result?.vote_count !== undefined) {
                    return {
                        voteAverage: result.vote_average,
                        voteCount: result.vote_count,
                    };
                }
            }
        }

        return null;
    }
}
