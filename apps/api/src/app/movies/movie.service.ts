import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Types } from 'mongoose';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
    QueryDslQueryContainer,
    SearchTotalHits,
    SortCombinations,
} from '@elastic/elasticsearch/lib/api/types';

import { MovieRepository } from './movie.repository';
import { MovieResponseDto } from './dtos';
import { Movie } from './movie.schema';
import {
    convertToObjectId,
    isNullOrUndefined,
    isTrue,
    sortedStringify,
} from '../../libs/utils/common';
import { RedisService } from '../../libs/modules/redis/services';
import { MovieType } from './movie.type';
import { UpdateMovieInput } from './inputs/mutate-movie.input';
import { GetMovieInput } from './inputs/get-movie.input';
import { SearchService } from './search.service';
import { GetMoviesInput } from './inputs/get-movies.input';
import { MutateHardDeleteMovieInput } from './inputs/mutate-hard-delete-movie.input';
import { CreateMovieInput } from './inputs/create-movie.input';
import { GetMoviesAdminInput } from './inputs/get-movies-admin.input';

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

    async createMovie(input: CreateMovieInput): Promise<MovieType> {
        const newMovie: Movie = {
            _id: new Types.ObjectId(),
            deletedAt: null,

            ...input,
            actors: input.actors?.map((c) => convertToObjectId(c)),
            categories: input.categories?.map((c) => convertToObjectId(c)),
            countries: input.countries?.map((c) => convertToObjectId(c)),
            directors: input.directors?.map((c) => convertToObjectId(c)),
            lastSyncModified: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const createdMovie = await this.movieRepo.create({
            document: newMovie,
        });
        await this.searchService.indexMovie(createdMovie);

        return new MovieResponseDto(createdMovie);
    }

    async getMovie({ _id, slug }: GetMovieInput, { populate = true }: { populate?: boolean } = {}) {
        if (isNullOrUndefined(_id) && isNullOrUndefined(slug)) {
            return null;
        }
        const filter = !isNullOrUndefined(_id) ? { _id: convertToObjectId(_id) } : { slug };
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

    async getMoviesEs(dto: GetMoviesAdminInput | GetMoviesInput) {
        const {
            resetCache = false,
            bypassCache = false,
            ...restDto
        } = { resetCache: false, bypassCache: false, isDeleted: false, ...dto };
        const cacheKey = `CACHED:MOVIES:ES:${sortedStringify(restDto)}`;

        if (isTrue(resetCache)) {
            await this.redisService.del(cacheKey);
        } else if (!isTrue(bypassCache)) {
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
            sortOrder = 'desc',
            status,
            isDeleted = false,
        } = { isDeleted: false, ...dto };

        const must: QueryDslQueryContainer['bool']['must'] = [];
        const mustNot: QueryDslQueryContainer['bool']['must_not'] = [];
        const filter: QueryDslQueryContainer[] = [];
        let keywordQuery: QueryDslQueryContainer | null = null;

        if (keywords) {
            keywordQuery = {
                bool: {
                    should: [
                        // Stage 1: Exact phrase match in name and originName
                        {
                            multi_match: {
                                query: keywords,
                                fields: ['name', 'originName'],
                                type: 'phrase',
                            },
                        },
                        // Stage 2: Partial phrase match in name and originName
                        {
                            multi_match: {
                                query: keywords,
                                fields: ['name', 'originName'],
                                type: 'phrase_prefix',
                            },
                        },
                        // Stage 3: Term match in slug and content
                        {
                            multi_match: {
                                query: keywords,
                                fields: ['slug', 'content'],
                                type: 'best_fields',
                                operator: 'and',
                            },
                        },
                        // Stage 4: Exact match in related fields
                        {
                            multi_match: {
                                query: keywords,
                                fields: [
                                    'categories.name',
                                    'countries.name',
                                    'directors.name',
                                    'actors.name',
                                ],
                                type: 'phrase',
                            },
                        },
                    ],
                    minimum_should_match: 1,
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
            const categorySlugs = categories
                .split(',')
                .filter((c) => !isNullOrUndefined(c))
                .map((c) => c.trim());

            must.push({
                terms: {
                    'categories.slug.keyword': categorySlugs,
                },
            });

            // Exclude sensitive content by default
            if (!categorySlugs.includes('phim-18')) {
                mustNot.push({
                    term: {
                        'categories.slug.keyword': 'phim-18',
                    },
                });
            }
        } else {
            // Exclude sensitive content by default
            mustNot.push({
                term: {
                    'categories.slug.keyword': 'phim-18',
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

        if (isDeleted) {
            filter.push({ exists: { field: 'deletedAt' } });
        } else {
            must.push({
                bool: {
                    must_not: [{ exists: { field: 'deletedAt' } }],
                },
            });
        }

        const query: QueryDslQueryContainer = {
            bool: {
                must: [...must, ...(keywordQuery ? [keywordQuery] : [])],
                must_not: mustNot,
                filter: filter,
            },
        };
        if (must?.length === 0 && filter?.length === 0 && !keywordQuery) {
            (query.bool.must as QueryDslQueryContainer[]).push({
                match_all: {},
            });
        }

        const sortFields = sortBy.split(',');
        const sortOrders = sortOrder.split(',');
        const sort = [
            {
                default: {
                    order: 'desc',
                    unmapped_type: 'keyword',
                },
            },
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
        ] as SortCombinations[];

        const minScore = keywords ? 0.5 : undefined;
        const body = await this.elasticsearchService.search({
            index: 'movies',
            body: {
                query,
                sort,
                from: (page - 1) * limit,
                size: limit,
                track_total_hits: true,
                ...(minScore && { min_score: minScore }),
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
        const { _id, actors, categories, countries, directors, deletedAt, ...restUpdateData } =
            input;
        const movieToUpdate: Partial<Movie> = { ...restUpdateData };

        if (actors) {
            movieToUpdate.actors = actors?.map((c) => convertToObjectId(c));
        }
        if (categories) {
            movieToUpdate.categories = categories?.map((c) => convertToObjectId(c));
        }
        if (directors) {
            movieToUpdate.directors = directors?.map((c) => convertToObjectId(c));
        }
        if (countries) {
            movieToUpdate.countries = countries?.map((c) => convertToObjectId(c));
        }

        if (!isNullOrUndefined(deletedAt)) {
            if (deletedAt === 'delete') {
                movieToUpdate.deletedAt = new Date();
            } else if (deletedAt === 'restore') {
                movieToUpdate.deletedAt = null;
            }
        }

        this.logger.log(movieToUpdate);
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

        return new MovieType(updatedMovie as unknown as MovieType);
    }

    async hardDeleteMovie(input: MutateHardDeleteMovieInput) {
        await Promise.allSettled([
            this.movieRepo.deleteOne({ _id: convertToObjectId(input._id) }),
            this.searchService.deleteMovie({ _id: convertToObjectId(input._id) }),
        ]);
        return 1;
    }
}
