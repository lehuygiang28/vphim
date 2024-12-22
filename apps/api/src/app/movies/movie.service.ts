import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ConfigService } from '@nestjs/config';
import {
    QueryDslQueryContainer,
    SearchTotalHits,
    SortCombinations,
} from '@elastic/elasticsearch/lib/api/types';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { MovieRepository } from './movie.repository';
import { MovieResponseDto } from './dtos';
import { Movie } from './movie.schema';
import {
    convertToObjectId,
    isNullOrUndefined,
    isTrue,
    sortedStringify,
    isEmptyObject,
    extractJSON,
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
import { systemInstruction } from './ai-movie.prompt';

@Injectable()
export class MovieService {
    private readonly logger: Logger;
    private readonly EXCLUDE_MOVIE_SRC: ('ophim' | 'kkphim' | 'nguonc')[] = [];
    private readonly genAI: GoogleGenerativeAI;
    private readonly AI_MODELS: string[] = [
        'models/gemini-2.0-flash-thinking-exp-1219',
        'models/gemini-2.0-flash-exp',
        'models/gemini-1.5-flash-8b',
        'models/gemini-1.5-flash',
    ];

    constructor(
        private readonly configService: ConfigService,
        private readonly movieRepo: MovieRepository,
        private readonly redisService: RedisService,
        private readonly searchService: SearchService,
        private readonly elasticsearchService: ElasticsearchService,
    ) {
        this.logger = new Logger(MovieService.name);
        this.EXCLUDE_MOVIE_SRC = (this.configService
            .get<string>('EXCLUDE_MOVIE_SRC')
            ?.split(',')
            ?.map((s: string | undefined) => s?.toString()?.trim()) || []) as (
            | 'ophim'
            | 'kkphim'
            | 'nguonc'
        )[];
        const googleApiKey = this.configService.get<string>('GOOGLE_API_KEY');
        if (googleApiKey) {
            this.genAI = new GoogleGenerativeAI(googleApiKey);
            this.logger.log('[AI] Gemini AI initialized');
        } else {
            this.logger.warn('[AI] Google API Key not provided. AI disabled.');
        }
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

        return new MovieResponseDto(createdMovie, { excludeSrc: this.EXCLUDE_MOVIE_SRC });
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
        return new MovieResponseDto(movie, { excludeSrc: this.EXCLUDE_MOVIE_SRC });
    }

    async getMoviesEs(dto: GetMoviesAdminInput | GetMoviesInput, isRestful = false) {
        const {
            keywords,
            useAI = false,
            resetCache = false,
            bypassCache = false,
            page = 1,
            limit = 10,
            categories,
            countries,
            years,
            ...restDto
        } = { resetCache: false, bypassCache: false, isDeleted: false, ...dto };

        const keywordsEncoded = encodeURIComponent(keywords);
        const cacheKey = `CACHED:MOVIES:ES:${sortedStringify({
            ...restDto,
            useAI,
            keywords: keywordsEncoded,
            page,
            limit,
            categories,
            countries,
            years,
        })}`;
        const aiFilterCacheKey = `CACHED:AI_FILTER:${sortedStringify({
            ...restDto,
            useAI,
            keywords: keywordsEncoded,
            categories,
            countries,
            years,
        })}`;

        if (isTrue(resetCache)) {
            await Promise.all([
                this.redisService.del(cacheKey),
                this.redisService.del(aiFilterCacheKey),
            ]);
        }
        if (!isTrue(bypassCache)) {
            const fromCache = await this.redisService.get<{ data: MovieType[]; total: number }>(
                cacheKey,
            );
            if (fromCache) {
                this.logger.log(`HIT: ${cacheKey}`);
                return {
                    data: fromCache.data.map((movie) => new MovieType(movie)),
                    total: fromCache.total,
                };
            }
        }

        this.logger.log(`MISS: ${cacheKey}`);

        let aiFilter: QueryDslQueryContainer | null = null;

        const analyzeAiAndSetToRedis = async () => {
            const aiAnalysis = await this.analyzeSearchQuery(keywords);
            if (aiAnalysis && !isEmptyObject(aiAnalysis)) {
                aiFilter = await this.getAIFilter(aiAnalysis, { categories, countries, years });

                await this.redisService.set(
                    aiFilterCacheKey,
                    JSON.stringify(aiFilter),
                    1000 * 60 * 30,
                );
            }
        };

        if (useAI && keywords && this.genAI) {
            try {
                const aiFilterFromCached = await this.redisService.get<string>(aiFilterCacheKey);
                aiFilter =
                    typeof aiFilterFromCached === 'string'
                        ? JSON.parse(aiFilterFromCached)
                        : aiFilterFromCached;

                if (!aiFilter) {
                    this.logger.log(`[AI] Analyzing: ${keywords}`);
                    await analyzeAiAndSetToRedis();
                }
            } catch (error) {
                this.logger.error(`[AI] Failed to analyze search query: ${error}}`);
                aiFilter = null;
            }
        }

        const query = aiFilter || (await this.buildTraditionalQuery(dto));
        const { data, total } = await this.executeSearch(query, dto, isRestful);

        const res = { data, total, count: data?.length || 0 };
        await this.redisService.set(cacheKey, res, 1000 * 30);

        return res;
    }

    private processYearFilter(years: string | undefined): QueryDslQueryContainer[] {
        const filter: QueryDslQueryContainer[] = [];
        if (!isNullOrUndefined(years)) {
            if (years.includes('-')) {
                const [startYear, endYear] = years.split('-').map(Number);
                filter.push({
                    range: {
                        year: {
                            gte: startYear,
                            lte: endYear,
                        },
                    },
                });
            } else {
                const yearList = years.split(',').map(Number).filter(Boolean);
                filter.push({ terms: { year: yearList } });
            }
        }
        return filter;
    }

    private async buildTraditionalQuery(
        dto: GetMoviesAdminInput | GetMoviesInput,
    ): Promise<QueryDslQueryContainer> {
        const {
            keywords,
            cinemaRelease,
            isCopyright,
            type,
            years,
            categories,
            countries,
            status,
            isDeleted = false,
        } = { isDeleted: false, ...dto };

        const must: QueryDslQueryContainer['bool']['must'] = [];
        const mustNot: QueryDslQueryContainer['bool']['must_not'] = [];
        const filter: QueryDslQueryContainer[] = [];

        if (keywords) {
            must.push({
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
            });
        }

        if (!isNullOrUndefined(cinemaRelease)) filter.push({ term: { cinemaRelease } });
        if (!isNullOrUndefined(isCopyright)) filter.push({ term: { isCopyright } });
        if (!isNullOrUndefined(type)) filter.push({ term: { type } });
        if (!isNullOrUndefined(status)) filter.push({ term: { status } });

        filter.push(...this.processYearFilter(years));

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

        return {
            bool: {
                must,
                must_not: mustNot,
                filter,
            },
        };
    }

    private async getAIFilter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        aiAnalysis: Record<string, any>,
        userFilters: {
            categories?: string;
            countries?: string;
            years?: string;
        },
    ): Promise<QueryDslQueryContainer> {
        const { categories, countries, years } = userFilters;
        const should: QueryDslQueryContainer[] = [];
        const filter: QueryDslQueryContainer[] = [];
        const mustNot: QueryDslQueryContainer[] = [];

        // Handle categories
        if (categories) {
            const categorySlugs = categories
                .split(',')
                .filter((c) => !isNullOrUndefined(c))
                .map((c) => c.trim());
            should.push({
                terms: {
                    'categories.slug.keyword': categorySlugs,
                    boost: 2,
                },
            });
            if (!categorySlugs.includes('phim-18')) {
                mustNot.push({
                    term: {
                        'categories.slug.keyword': 'phim-18',
                    },
                });
            }
        } else if (aiAnalysis.categories?.length) {
            should.push({
                terms: {
                    'categories.slug.keyword': aiAnalysis.categories,
                    boost: 1.5,
                },
            });
            if (!aiAnalysis.categories.includes('phim-18')) {
                mustNot.push({
                    term: {
                        'categories.slug.keyword': 'phim-18',
                    },
                });
            }
        }

        // Handle countries
        if (countries) {
            should.push({
                terms: {
                    'countries.slug.keyword': countries
                        .split(',')
                        .filter((c) => !isNullOrUndefined(c))
                        .map((c) => c.trim()),
                    boost: 2,
                },
            });
        } else if (aiAnalysis.countries?.length) {
            should.push({
                terms: {
                    'countries.slug.keyword': aiAnalysis.countries,
                    boost: 1.3,
                },
            });
        }

        filter.push(...this.processYearFilter(years));

        if (!years && aiAnalysis.yearRange) {
            const yearRange: { gte?: number; lte?: number } = {};
            if (aiAnalysis.yearRange.min) yearRange.gte = aiAnalysis.yearRange.min;
            if (aiAnalysis.yearRange.max) yearRange.lte = aiAnalysis.yearRange.max;
            if (Object.keys(yearRange).length) {
                filter.push({ range: { year: yearRange } });
            }
        }

        // Add other AI-generated filters
        if (aiAnalysis.must) {
            if (aiAnalysis.must.name?.length) {
                should.push({
                    multi_match: {
                        query: aiAnalysis.must.name.join(' '),
                        fields: ['name^3', 'originName^2'],
                        type: 'best_fields',
                        operator: 'or',
                        boost: 2,
                    },
                });
            }

            if (aiAnalysis.must.content?.length) {
                should.push({
                    match: {
                        content: {
                            query: aiAnalysis.must.content.join(' '),
                            operator: 'or',
                            minimum_should_match: '50%',
                            boost: 1.5,
                        },
                    },
                });
            }

            if (aiAnalysis.must.actors?.length) {
                should.push({
                    terms: {
                        'actors.name.keyword': aiAnalysis.must.actors,
                        boost: 1.2,
                    },
                });
            }

            if (aiAnalysis.must.directors?.length) {
                should.push({
                    terms: {
                        'directors.name.keyword': aiAnalysis.must.directors,
                        boost: 1.2,
                    },
                });
            }
        }

        if (aiAnalysis.should) {
            if (aiAnalysis.should.name?.length) {
                should.push({
                    multi_match: {
                        query: aiAnalysis.should.name.join(' '),
                        fields: ['name^2', 'originName^1.5'],
                        type: 'best_fields',
                        operator: 'or',
                    },
                });
            }

            if (aiAnalysis.should.content?.length) {
                should.push({
                    match: {
                        content: {
                            query: aiAnalysis.should.content.join(' '),
                            operator: 'or',
                            minimum_should_match: '30%',
                            boost: 1.2,
                        },
                    },
                });
            }

            if (aiAnalysis.should.actors?.length) {
                should.push({
                    terms: {
                        'actors.name.keyword': aiAnalysis.should.actors,
                        boost: 1.1,
                    },
                });
            }

            if (aiAnalysis.should.directors?.length) {
                should.push({
                    terms: {
                        'directors.name.keyword': aiAnalysis.should.directors,
                        boost: 1.1,
                    },
                });
            }
        }

        if (aiAnalysis.keywords?.length) {
            should.push({
                multi_match: {
                    query: aiAnalysis.keywords.join(' '),
                    fields: [
                        'name^3',
                        'originName^2',
                        'content^1.5',
                        'actors.name^1.2',
                        'directors.name^1.2',
                        'categories.name',
                        'countries.name',
                    ],
                    type: 'best_fields',
                    operator: 'or',
                    minimum_should_match: '30%',
                },
            });
        }

        return {
            bool: {
                should,
                filter,
                must_not: mustNot,
                minimum_should_match: 1,
            },
        };
    }

    private async executeSearch(
        query: QueryDslQueryContainer,
        dto: GetMoviesAdminInput | GetMoviesInput,
        isRestful: boolean,
    ): Promise<{ data: MovieType[]; total: number }> {
        const { limit = 10, page = 1, sortBy = 'year', sortOrder = 'desc', keywords } = dto;

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
        this.logger.log({ query, sort });
        const body = await this.elasticsearchService.search({
            index: 'movies',
            body: {
                query,
                sort,
                from: (page - 1) * Math.min(limit, 500),
                size: Math.min(limit, 500),
                track_total_hits: true,
                ...(minScore && { min_score: minScore }),
            },
        });

        let movies = body.hits.hits.map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (hit) => new MovieType({ ...(hit as any)?.['_source'], _id: hit?._id }),
        );

        const total = (body.hits.total as SearchTotalHits).value;

        if (isRestful) {
            movies = movies?.map(
                (movie) =>
                    ({
                        _id: movie?._id,
                        slug: movie?.slug,
                        name: movie?.name,
                        originName: movie?.originName,
                        quality: movie?.quality,
                        year: movie?.year,
                        lastSyncModified: movie?.lastSyncModified,
                        createdAt: movie?.createdAt,
                        updatedAt: movie?.updatedAt,
                    } as MovieType),
            );
        }

        const res = {
            data: movies,
            total,
            count: movies?.length || 0,
        };

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

    private async analyzeSearchQuery(query: string) {
        if (!this.genAI) {
            this.logger.warn('Google API Key not provided. Skipping AI analysis.');
            return null;
        }

        for (const modelName of this.AI_MODELS) {
            try {
                const model = this.genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: systemInstruction,
                    generationConfig: {
                        temperature: 0.3,
                        topK: 35,
                        topP: 0.8,
                    },
                });

                const result = await model.generateContent({
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: `The query of user: "${query?.trim()}"` }],
                        },
                    ],
                });
                const text = result.response.text();
                this.logger.log(`[AI] response from model ${modelName}: ${text}`);

                try {
                    return extractJSON(text);
                } catch (error) {
                    this.logger.error(
                        `Failed to parse AI response from model ${modelName}: ${error}`,
                    );
                    this.logger.error(`Raw response: ${text}`);
                    // Continue to the next model if JSON parsing fails
                }
            } catch (error) {
                this.logger.error(`Error with model ${modelName}: ${error}`);
                // Continue to the next model if there's an error
            }
        }

        this.logger.error('[AI] All AI models failed. Returning null.');
        return null;
    }
}
