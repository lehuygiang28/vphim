import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MovieDb, CreditsResponse, ExternalId } from 'moviedb-promise';

import { TmdbType } from 'apps/api/src/app/movies/movie.type';

@Injectable()
export class TmdbService {
    public readonly moviedb: MovieDb;
    public readonly config: { imgHost: string };
    private readonly logger = new Logger(TmdbService.name);

    constructor(private readonly configService: ConfigService) {
        this.moviedb = new MovieDb(this.configService.getOrThrow('TMDB_API_KEY'));
        this.config = {
            imgHost: this.configService.getOrThrow(
                'TMDB_IMG_HOST',
                'https://image.tmdb.org/t/p/original',
            ),
        };
    }

    public async findByImdbId(imdbId: string): Promise<TmdbType | null> {
        try {
            const foundResult = await this.moviedb.find({
                id: imdbId,
                external_source: ExternalId.ImdbId,
            });

            if (!foundResult) {
                return null;
            }

            if (foundResult?.movie_results?.length > 0 || foundResult?.tv_results?.length > 0) {
                const res = foundResult.tv_results[0] || foundResult.movie_results[0];
                return {
                    type: res.media_type,
                    id: res.id?.toString(),
                    voteAverage: res.vote_average,
                    voteCount: res.vote_count,
                };
            }
        } catch (error) {
            this.logger.error(`Failed to fetch TMDB data for IMDb ID ${imdbId}:`, error);
        }
        return null;
    }

    public async getCreditDetails(tmdbData: TmdbType): Promise<CreditsResponse | null> {
        let data: CreditsResponse | null = null;

        if (tmdbData?.id && tmdbData?.type && tmdbData?.season) {
            return this.moviedb.seasonCredits({
                id: tmdbData.id,
                season_number: tmdbData.season,
            });
        }

        switch (tmdbData.type) {
            case 'tv': {
                data = await this.moviedb.tvCredits({
                    id: tmdbData.id,
                });
                break;
            }
            case 'movie': {
                data = await this.moviedb.movieCredits({
                    id: tmdbData.id,
                });
                break;
            }
            default: {
                break;
            }
        }

        return data;
    }
}
