import { Core } from './core';
import type { MovieType } from './enum';
import type { Category, Movie, NewestResponse, Region, SearchResponse, Server } from './types';
import type { OPhimResponseList, OPhimResponseSingle } from './types/response-wrapper';

export class Ophim extends Core {
    /**
     * Search movies by keyword
     *
     * @param {{ keyword: string }} params - Parameters
     * @param {string} params.keyword - Keyword to search
     * @returns {Promise<SearchResponse>} - Promise with search result
     *
     * @example
     * const searchResult = await ophim.searchMovies({ keyword: 'one piece' });
     */
    public searchMovies({ keyword }: { keyword: string }): Promise<SearchResponse> {
        const normalizedKeyword = encodeURIComponent(keyword.trim());
        return this.request(`v1/api/tim-kiem/${normalizedKeyword}`);
    }

    /**
     * Get newest movies
     *
     * `limit` maybe not work on some way, so it's better to use default limit
     *
     * @param {{page?: number, limit?: number}} [params] - Parameters
     * @returns {Promise<NewestResponse>}
     *
     * @example
     * const newestMovies = await ophim.getNewestMovies({ page: 1, limit: 24 });
     */
    public getNewestMovies({ page = 1, limit = 24 }): Promise<NewestResponse> {
        return this.request(`danh-sach/phim-moi-cap-nhat?page=${page}&limit=${limit}`);
    }

    /**
     * Get movie detail by slug or id
     *
     * Slug is preferred over id. If both are provided, slug will be used.
     *
     * @param {{_id?: string, slug?: string}} [params] - Parameters
     * @returns {Promise<OPhimResponseSingle<Movie & {episodes?: Server[]}>>}
     *
     * @example
     * const movieDetail = await ophim.getMovieDetail({ slug: 'one-piece-film-red' });
     *
     * @example
     * const movieDetail = await ophim.getMovieDetail({ _id: '62de6c802d8263cfd10a2d48' });
     */
    public getMovieDetail(params: Partial<Pick<Movie, '_id' | 'slug'>>): Promise<
        OPhimResponseSingle<
            Movie & {
                episodes?: Server[];
            }
        >
    > {
        this.requireAtLeastOne(params, ['slug']);

        if (params?.slug) {
            return this.request(`v1/api/phim/${encodeURIComponent(params.slug)}`);
        }

        if (params?._id) {
            return this.request(`v1/api/phim/id/${encodeURIComponent(params._id)}`);
        }

        return Promise.reject(new Error('Missing required parameters'));
    }

    public getCategories(): Promise<OPhimResponseList<Category>> {
        return this.request('v1/api/the-loai');
    }

    public getMoviesByCategory({
        slug,
    }: Pick<Category, 'slug'>): Promise<OPhimResponseList<Movie>> {
        return this.request(`v1/api/the-loai/${encodeURIComponent(slug)}`);
    }

    public getRegions(): Promise<OPhimResponseList<Region>> {
        return this.request('v1/api/quoc-gia');
    }

    public getMoviesByRegion({ slug }: Pick<Region, 'slug'>): Promise<OPhimResponseList<Movie>> {
        return this.request(`v1/api/quoc-gia/${encodeURIComponent(slug)}`);
    }

    public getMoviesByType({
        movieType,
    }: { movieType: MovieType }): Promise<OPhimResponseList<Movie>> {
        return this.request(`v1/api/danh-sach/${encodeURIComponent(movieType)}`);
    }
}
