import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Movie } from './movie.schema';
import { MovieRepository } from './movie.repository';
import { convertToObjectId } from '../../libs/utils/common';

@Injectable()
export class SearchService {
    private readonly logger = new Logger(SearchService.name);

    constructor(
        private readonly elasticsearchService: ElasticsearchService,
        private readonly movieRepo: MovieRepository,
    ) {}

    async search(text: string) {
        const { hits } = await this.elasticsearchService.search({
            index: 'movies',
            body: {
                query: {
                    multi_match: {
                        query: text,
                        fields: ['name', 'originName', 'content', 'slug'],
                    },
                },
            },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return hits.hits.map((hit: any) => hit._source);
    }

    async indexMovie(movie: Movie) {
        const movieData = await this.movieRepo.findOne({
            filterQuery: { _id: convertToObjectId(movie?._id) },
            queryOptions: {
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
            },
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _id, ...rest } = movieData;
        const body: Omit<Movie, '_id'> = {
            ...rest,
        };

        return this.elasticsearchService.index({
            index: 'movies',
            id: movie._id.toString(),
            body: body,
        });
    }

    async deleteMovie(movieId: string) {
        return this.elasticsearchService.delete({
            index: 'movies',
            id: movieId,
        });
    }

    async bulkIndexMovies(movies: Movie[]) {
        const body = movies.flatMap((movie) => {
            const { _id, ...rest } = movie;
            return [{ index: { _index: 'movies', _id: _id.toString() } }, rest];
        });

        return this.elasticsearchService.bulk({ refresh: true, body });
    }

    async indexAllMovies(clear = false) {
        const batchSize = 1000;
        let skip = 0;
        let movies: Movie[];

        if (clear) {
            const clear = await this.elasticsearchService.indices.delete({ index: 'movies' });
            this.logger.log(`Cleared index: ${clear.acknowledged}`);
        }
        do {
            this.logger.log(`Fetching movies with skip: ${skip}, limit: ${batchSize}`);
            movies = await this.movieRepo.find({
                filterQuery: {},
                queryOptions: {
                    skip,
                    limit: batchSize,
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
                    sort: { updatedAt: 1 },
                },
            });

            if (movies.length > 0) {
                this.logger.log(`Indexing ${movies.length} movies`);
                await this.bulkIndexMovies(movies);
                this.logger.log(`Indexed ${movies.length} movies`);
            }

            skip += batchSize;
        } while (movies.length === batchSize);

        this.logger.log('Finished indexing all movies');
        await this.setMaxResultWindow();
    }

    async setMaxResultWindow(indexName = 'movies', maxResultWindow = 350000) {
        try {
            const response = await this.elasticsearchService.indices.putSettings({
                index: indexName,
                body: {
                    'index.max_result_window': maxResultWindow,
                },
            });

            if (response.acknowledged) {
                this.logger.log(
                    `Successfully set index.max_result_window to ${maxResultWindow} for index ${indexName}`,
                );
            } else {
                this.logger.warn(
                    `Failed to set index.max_result_window for index ${indexName}. Response: ${JSON.stringify(
                        response,
                    )}`,
                );
            }

            return response;
        } catch (error) {
            this.logger.error(
                `Error setting index.max_result_window for index ${indexName}: ${error.message}`,
            );
            throw error;
        }
    }
}
