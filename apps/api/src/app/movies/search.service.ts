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
        try {
            const movieData = await this.movieRepo.findOne({
                filterQuery: { _id: convertToObjectId(movie._id) },
                queryOptions: {
                    populate: [
                        { path: 'actors', justOne: false },
                        { path: 'categories', justOne: false },
                        { path: 'countries', justOne: false },
                        { path: 'directors', justOne: false },
                    ],
                },
            });

            if (!movieData) {
                this.logger.warn(`Movie with ID ${movie._id} not found in the database`);
                return false;
            }

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { _id, ...rest } = movieData;
            const body: Omit<Movie, '_id'> = { ...rest };

            const updateResponse = await this.elasticsearchService.update({
                index: 'movies',
                id: movie._id.toString(),
                body: {
                    doc: body,
                    doc_as_upsert: true,
                },
                refresh: 'wait_for', // Wait for the change to be reflected
            });

            if (updateResponse.result === 'updated' || updateResponse.result === 'created') {
                // Perform an immediate refresh of the index
                await this.elasticsearchService.indices.refresh({ index: 'movies' });

                this.logger.debug(
                    `Movie with ID ${movie._id} ${updateResponse.result} successfully in Elasticsearch`,
                );
                return true;
            } else {
                this.logger.warn(`Failed to update movie with ID ${movie._id} in Elasticsearch`);
                return false;
            }
        } catch (error) {
            this.logger.error(
                `Error updating movie with ID ${movie._id} in Elasticsearch: ${error.message}`,
            );
            return false;
        }
    }

    async deleteMovie(movie: Pick<Movie, '_id'>) {
        try {
            const deleteResponse = await this.elasticsearchService.delete({
                index: 'movies',
                id: movie?._id?.toString(),
                refresh: 'wait_for', // Wait for the change to be reflected
            });

            if (deleteResponse.result === 'deleted') {
                // Perform an immediate refresh of the index
                await this.elasticsearchService.indices.refresh({ index: 'movies' });

                this.logger.debug(
                    `Movie with ID ${movie._id} deleted successfully from Elasticsearch`,
                );
                return true;
            } else {
                this.logger.warn(`Failed to delete movie with ID ${movie._id} from Elasticsearch`);
                return false;
            }
        } catch (error) {
            this.logger.error(
                `Error deleting movie with ID ${movie._id} from Elasticsearch: ${error.message}`,
            );
        }
    }

    async bulkIndexMovies(movies: Movie[]) {
        const body = movies.flatMap((movie) => {
            const { _id, ...rest } = movie;
            return [
                { index: { _index: 'movies', _id: _id.toString() } },
                { deletedAt: null, ...rest },
            ];
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
                        { path: 'actors', justOne: false },
                        { path: 'categories', justOne: false },
                        { path: 'countries', justOne: false },
                        { path: 'directors', justOne: false },
                    ],
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
        await this.updateMappings();
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

    async updateMappings(indexName = 'movies') {
        try {
            const res = await this.elasticsearchService.indices.putMapping({
                index: 'movies',
                body: {
                    properties: {
                        deletedAt: {
                            type: 'date',
                            null_value: null,
                        },
                    },
                },
            });
            if (res.acknowledged) {
                this.logger.log(`Successfully updated mappings for index ${indexName}`);
            } else {
                this.logger.warn(
                    `Failed to update mappings for index ${indexName}. Response: ${JSON.stringify(
                        res,
                    )}`,
                );
            }
        } catch (error) {
            this.logger.error(`Error updating mappings for index ${indexName}: ${error.message}`);
        }
    }

    async softRefresh() {
        const deletedMovies = await this.movieRepo.find({
            filterQuery: { deletedAt: { $ne: null } },
            queryOptions: {
                populate: [
                    { path: 'actors', justOne: false },
                    { path: 'categories', justOne: false },
                    { path: 'countries', justOne: false },
                    { path: 'directors', justOne: false },
                ],
            },
        });
        if (deletedMovies && deletedMovies?.length > 0) {
            this.logger.log(`Soft refreshing ${deletedMovies?.length} movies`);
            await this.bulkIndexMovies(deletedMovies);
            await this.elasticsearchService.indices.refresh({ index: 'movies' });
        }
        return '1';
    }
}
