import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { FilterQuery, PipelineStage } from 'mongoose';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
    QueryDslQueryContainer,
    SearchTotalHits,
    Sort,
} from '@elastic/elasticsearch/lib/api/types';

import { MovieRepository } from './movie.repository';
import { GetMoviesDto, MovieResponseDto } from './dtos';
import { Movie } from './movie.schema';
import { convertToObjectId, isNullOrUndefined, sortedStringify } from '../../libs/utils/common';
import { RedisService } from '../../libs/modules/redis/services';
import { RatingResultType } from './rating-result.type';
import { GetRatingOutput } from './outputs/get-rating.output';
import { MovieType } from './movie.type';
import { UpdateMovieInput } from './inputs/mutate-movie.input';
import { GetMovieInput } from './inputs/get-movie.input';
import { SearchService } from './search.service';

@Injectable()
export class MovieService {
    private readonly logger: Logger;

    constructor(
        private readonly movieRepo: MovieRepository,
        private readonly redisService: RedisService,
        private readonly httpService: HttpService,
        private readonly searchService: SearchService,
        private readonly elasticsearchService: ElasticsearchService,
    ) {
        this.logger = new Logger(MovieService.name);
    }

    async getMovie({ id, slug }: GetMovieInput, { populate = true }: { populate?: boolean } = {}) {
        if (isNullOrUndefined(id) && isNullOrUndefined(slug)) {
            return null;
        }
        const filter = !isNullOrUndefined(id) ? { _id: convertToObjectId(id) } : { slug };
        const movie = await this.movieRepo.findOneOrThrow({
            filterQuery: filter,
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

    async getMovies(dto: GetMoviesDto, { deepSearch = false }: { deepSearch?: boolean } = {}) {
        const { resetCache } = dto;
        const cacheKey = `CACHED:MOVIES:${sortedStringify(dto)}`;

        if (resetCache) {
            await this.redisService.del(cacheKey);
        } else {
            const fromCache = await this.redisService.get<MovieType>(cacheKey);
            if (fromCache) {
                this.logger.debug(`CACHE: ${cacheKey}`);
                return new MovieType(fromCache);
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
            status,
        } = dto;

        const pipeline: PipelineStage[] = [];
        const match: FilterQuery<Movie> = {};

        const lookupStage = [
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

        if (keywords) {
            const searchResults = await this.searchService.search(keywords);
            const total = searchResults.length;
            const movies = searchResults
                .slice((page - 1) * limit, page * limit)
                .map((result) => new MovieResponseDto(result));

            return {
                data: movies,
                total,
            };
        }

        if (!isNullOrUndefined(cinemaRelease)) match.cinemaRelease = cinemaRelease;
        if (!isNullOrUndefined(isCopyright)) match.isCopyright = isCopyright;
        if (!isNullOrUndefined(type)) match.type = type;
        if (!isNullOrUndefined(status)) match.status = status;
        if (!isNullOrUndefined(years)) {
            match.year = {
                $in: years
                    .split(',')
                    .map((year) => Number(year.trim()))
                    .filter(Boolean),
            };
        }

        if (!isNullOrUndefined(categories)) {
            match['categories.slug'] = {
                $in: categories
                    .split(',')
                    .filter((c) => !isNullOrUndefined(c))
                    .map((c) => c.trim()),
            };
        }

        if (!isNullOrUndefined(countries)) {
            match['countries.slug'] = {
                $in: countries
                    .split(',')
                    .filter((c) => !isNullOrUndefined(c))
                    .map((c) => c.trim()),
            };
        }

        if (deepSearch) {
            // If is keyword search with deep search, then need to lookup earlier match stage
            pipeline.push(...lookupStage);
            pipeline.push({ $match: match });
        } else {
            pipeline.push({ $match: match });
            pipeline.push(...lookupStage);
        }

        // Handle multi-field sorting
        const sortFields = sortBy.split(',');
        const sortOrders = sortOrder.split(',');
        const sortStage: Record<string, 1 | -1> = {};
        sortFields.forEach((field, index) => {
            const order = sortOrders[index] || sortOrders[sortOrders.length - 1];
            sortStage[field.trim()] = order.toLowerCase() === 'asc' ? 1 : -1;
        });

        pipeline.push(
            {
                $facet: {
                    movies: [
                        { $sort: sortStage },
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
        await this.redisService.set(cacheKey, res, 1000 * 60 * 10);
        return res;
    }

    async getMoviesEs(dto: GetMoviesDto) {
        const { resetCache } = dto;
        const cacheKey = `CACHED:MOVIES:ES:${sortedStringify(dto)}`;

        if (resetCache) {
            await this.redisService.del(cacheKey);
        } else {
            const fromCache = await this.redisService.get<{ data: MovieType[]; total: number }>(
                cacheKey,
            );
            if (fromCache) {
                this.logger.debug(`CACHE: ${cacheKey}`);
                return {
                    data: fromCache.data.map((movie) => new MovieType(movie)),
                    total: fromCache.total,
                };
            }
        }

        this.logger.debug(`ES: ${cacheKey}`);

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
            status,
        } = dto;

        const must: QueryDslQueryContainer[] = [];
        const filter: QueryDslQueryContainer[] = [];
        let keywordQuery: QueryDslQueryContainer | null = null;

        if (keywords) {
            keywordQuery = {
                function_score: {
                    query: {
                        bool: {
                            should: [
                                // Stage 1: Search in name and originName
                                {
                                    multi_match: {
                                        query: keywords,
                                        fields: ['name^3', 'originName^2'],
                                        type: 'phrase',
                                        slop: 2,
                                        boost: 2,
                                    },
                                },
                                // Stage 2: Search in slug and content
                                {
                                    multi_match: {
                                        query: keywords,
                                        fields: ['slug^1.5', 'content'],
                                        type: 'best_fields',
                                        slop: 3,
                                        boost: 1.5,
                                    },
                                },
                                // Stage 3: Search in related fields
                                {
                                    multi_match: {
                                        query: keywords,
                                        fields: [
                                            'categories.name^0.8',
                                            'countries.name^0.8',
                                            'directors.name^0.9',
                                            'actors.name^0.9',
                                            'categories.slug^0.7',
                                            'countries.slug^0.7',
                                            'directors.slug^0.8',
                                            'actors.slug^0.8',
                                        ],
                                        type: 'best_fields',
                                        slop: 2,
                                        boost: 1,
                                    },
                                },
                            ],
                            minimum_should_match: 1,
                        },
                    },
                    functions: [
                        {
                            filter: { match_phrase: { name: { query: keywords, slop: 1 } } },
                            weight: 3,
                        },
                        {
                            filter: { match_phrase: { originName: { query: keywords, slop: 1 } } },
                            weight: 2,
                        },
                        {
                            filter: { match_phrase: { slug: { query: keywords, slop: 1 } } },
                            weight: 1.5,
                        },
                    ],
                    score_mode: 'sum',
                    boost_mode: 'multiply',
                },
            };
        }
        if (!isNullOrUndefined(cinemaRelease)) filter.push({ term: { cinemaRelease } });
        if (!isNullOrUndefined(isCopyright)) filter.push({ term: { isCopyright } });
        if (!isNullOrUndefined(type)) filter.push({ term: { type } });
        if (!isNullOrUndefined(status)) filter.push({ term: { status } });
        if (!isNullOrUndefined(years)) {
            if (years.includes('-')) {
                const [startYear, endYear] = years.split('-');
                const yearsArray = [];

                for (let year = Number(startYear); year <= Number(endYear); year++) {
                    yearsArray.push(year);
                }

                filter.push({
                    terms: {
                        year: yearsArray,
                    },
                });
            } else {
                filter.push({
                    terms: {
                        year: years
                            .split(',')
                            .map((year) => Number(year.trim()))
                            .filter(Boolean),
                    },
                });
            }
        }

        if (!isNullOrUndefined(categories)) {
            must.push({
                terms: {
                    'categories.slug.keyword': categories
                        .split(',')
                        .filter((c) => !isNullOrUndefined(c))
                        .map((c) => c.trim()),
                },
            });
        }

        if (!isNullOrUndefined(countries)) {
            must.push({
                terms: {
                    'countries.slug.keyword': countries
                        .split(',')
                        .filter((c) => !isNullOrUndefined(c))
                        .map((c) => c.trim()),
                },
            });
        }

        const query: QueryDslQueryContainer = {
            bool: {
                must: [...must, ...(keywordQuery ? [keywordQuery] : [])],
                filter,
            },
        };

        const sortFields = sortBy.split(',');
        const sortOrders = sortOrder.split(',');
        const sort = [
            ...(sortFields || []).map((field, index) => {
                const order = (
                    sortOrders[index] || sortOrders[sortOrders.length - 1]
                ).toLowerCase();
                return {
                    [field.trim()]: {
                        order,
                        unmapped_type: 'keyword',
                    },
                };
            }),
            ...(keywords
                ? [
                      {
                          _score: { order: 'desc' },
                      },
                  ]
                : []),
        ] as Sort;

        const body = await this.elasticsearchService.search({
            index: 'movies',
            body: {
                query,
                sort,
                from: (page - 1) * limit,
                size: limit,
            },
        });

        const movies = body.hits.hits.map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (hit) => new MovieType({ ...(hit as any)?.['_source'], _id: hit?._id }),
        );
        const total = (body.hits.total as SearchTotalHits).value;

        const res = {
            data: movies,
            total,
        };
        await this.redisService.set(cacheKey, res, 1000 * 30);

        return res;
    }

    async updateView(slug: string) {
        const movie = await this.movieRepo.findOneOrThrow({ filterQuery: { slug } });
        const movieUpdated = await this.movieRepo.findOneAndUpdateOrThrow({
            filterQuery: { slug },
            updateQuery: { view: (movie?.view || 0) + 1 },
        });
        return {
            status: 'success',
            view: movie?.view || 0,
            newView: movieUpdated?.view || 0,
        };
    }

    async updateMovie(input: UpdateMovieInput): Promise<MovieType> {
        const { _id, ...updateData } = input;
        const { actors, categories, countries, directors, ...restUpdateData } = updateData;
        const movieToUpdate: Partial<Movie> = { ...restUpdateData };

        if (actors) {
            movieToUpdate.actors = updateData.actors?.map((c) => convertToObjectId(c));
        }
        if (categories) {
            movieToUpdate.categories = updateData.categories?.map((c) => convertToObjectId(c));
        }
        if (directors) {
            movieToUpdate.directors = updateData.directors?.map((c) => convertToObjectId(c));
        }
        if (countries) {
            movieToUpdate.countries = updateData.countries?.map((c) => convertToObjectId(c));
        }

        const updatedMovie = await this.movieRepo.findOneAndUpdateOrThrow({
            filterQuery: { _id: convertToObjectId(_id) },
            updateQuery: { $set: movieToUpdate },
            queryOptions: {
                new: true,
                populate: [
                    { path: 'actors', justOne: false },
                    { path: 'categories', justOne: false },
                    { path: 'countries', justOne: false },
                    { path: 'directors', justOne: false },
                ],
            },
        });

        // Clear cache for this movie
        const cacheKey = `CACHED:MOVIES:${updatedMovie.slug}`;
        await this.redisService.del(cacheKey);

        return new MovieType(updatedMovie as unknown as MovieType);
    }

    async getRating(movieSlug: string): Promise<GetRatingOutput> {
        const movie = await this.movieRepo.findOneOrThrow({ filterQuery: { slug: movieSlug } });
        const result: GetRatingOutput = {
            imdb: {},
            tmdb: {},
        };
        const headers = {
            accept: 'application/json',
        };

        try {
            if (movie?.imdb?.id) {
                result.imdb = { id: movie?.imdb?.id };
                const res = await this.httpService.axiosRef.get(
                    `https://api.themoviedb.org/3/find/${movie?.imdb?.id}?external_source=imdb_id&api_key=${process?.env?.TMDB_API_KEY}`,
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
                    `https://api.themoviedb.org/3/movie/${movie?.tmdb?.id}?language=en-US&api_key=${process?.env?.TMDB_API_KEY}`,
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
        } catch (error) {
            this.logger.error(error);
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
