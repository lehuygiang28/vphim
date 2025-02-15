import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TmdbType } from 'apps/api/src/app/movies/movie.type';
import { MovieDb, CreditsResponse } from 'moviedb-promise';

@Injectable()
export class TmdbService {
    public readonly moviedb: MovieDb;
    public readonly config: { imgHost: string };

    constructor(private readonly configService: ConfigService) {
        this.moviedb = new MovieDb(this.configService.get('TMDB_API_KEY'));
        this.config = {
            imgHost: this.configService.getOrThrow(
                'TMDB_IMG_HOST',
                'https://image.tmdb.org/t/p/original',
            ),
        };
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
