import { Injectable, Logger } from '@nestjs/common';
import {
    DashboardData,
    StatOverview,
    MoviesByType,
    TopViewedMovie,
    RecentComment,
    UserGrowth,
    MovieGrowth,
    TrendingMovie,
    RecentActivity,
} from './dashboard.type';
import { MovieService } from '../movies/movie.service';
import { UsersService } from '../users/users.service';
import { CommentService } from '../comments/comments.service';

@Injectable()
export class DashboardService {
    private readonly logger = new Logger(DashboardService.name);

    constructor(
        private readonly movieService: MovieService,
        private readonly usersService: UsersService,
        private readonly commentsService: CommentService,
    ) {}

    async getDashboardData(): Promise<DashboardData> {
        this.logger.log('Fetching dashboard data');

        const [
            overview,
            moviesByType,
            topViewedMovies,
            recentComments,
            userGrowth,
            movieGrowth,
            trendingToday,
            recentActivities,
        ] = await Promise.all([
            this.getOverview(),
            this.getMoviesByType(),
            this.getTopViewedMovies(),
            this.getRecentComments(),
            this.getUserGrowth(),
            this.getMovieGrowth(),
            this.getTrendingToday(),
            this.getRecentActivities(),
        ]);

        this.logger.log('Dashboard data fetched successfully');

        return {
            overview,
            moviesByType,
            topViewedMovies,
            recentComments,
            userGrowth,
            movieGrowth,
            trendingToday,
            recentActivities,
        };
    }

    private async getOverview(): Promise<StatOverview> {
        this.logger.log('Getting overview statistics');

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [
            totalMovies,
            totalUsers,
            totalComments,
            totalCategories,
            moviesAddedToday,
            moviesUpdatedToday,
            commentsToday,
            newUsersToday,
        ] = await Promise.all([
            this.movieService.countMovies(),
            this.usersService.countUsers(),
            this.commentsService.countComments(),
            this.movieService.countCategories(),
            this.movieService.countMoviesCreatedBetween(today, tomorrow),
            this.movieService.countMoviesUpdatedBetween(today, tomorrow),
            this.commentsService.countCommentsByDateRange(today, tomorrow),
            this.usersService.countUsersByDateRange(today, tomorrow),
        ]);

        this.logger.log(
            `Overview: ${totalMovies} movies, ${moviesAddedToday} added today, ${moviesUpdatedToday} updated today`,
        );

        return {
            totalMovies,
            totalUsers,
            totalComments,
            totalCategories,
            moviesAddedToday,
            moviesUpdatedToday,
            commentsToday,
            newUsersToday,
        };
    }

    private async getMoviesByType(): Promise<MoviesByType[]> {
        return this.movieService.countMoviesByType();
    }

    private async getTopViewedMovies(limit = 5): Promise<TopViewedMovie[]> {
        return this.movieService.getTopViewedMovies(limit);
    }

    private async getTrendingToday(limit = 5): Promise<TrendingMovie[]> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.movieService.getTrendingMovies(today, limit);
    }

    private async getRecentActivities(limit = 10): Promise<RecentActivity[]> {
        const activities: RecentActivity[] = [];

        // Get recent movie updates
        const recentMovieUpdates = await this.movieService.getRecentlyUpdatedMovies(limit);
        for (const movie of recentMovieUpdates) {
            activities.push({
                type: 'movie_update',
                message: `Movie "${movie.name}" was updated`,
                entityId: movie._id,
                entityName: movie.name,
                entitySlug: movie.slug,
                timestamp: movie.updatedAt || new Date(),
            });
        }

        // Get recent comments
        const recentComments = await this.commentsService.getRecentComments(limit);
        for (const comment of recentComments) {
            try {
                const movie = await this.movieService.getMovie({ _id: comment.movieId });
                const user = await this.usersService.findById(comment.user._id);

                if (movie && user) {
                    activities.push({
                        type: 'comment',
                        message: `${user.fullName} commented on "${movie.name}"`,
                        entityId: movie._id.toString(),
                        entityName: movie.name,
                        entitySlug: movie.slug,
                        timestamp: comment.createdAt,
                    });
                }
            } catch (error) {
                continue;
            }
        }

        // Get recently added movies
        const recentlyAddedMovies = await this.movieService.getRecentlyAddedMovies(limit);
        for (const movie of recentlyAddedMovies) {
            activities.push({
                type: 'movie_add',
                message: `New movie "${movie.name}" was added`,
                entityId: movie._id,
                entityName: movie.name,
                entitySlug: movie.slug,
                timestamp: movie.createdAt || new Date(),
            });
        }

        // Sort all activities by timestamp (newest first)
        activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        // Return only the first 'limit' activities
        return activities.slice(0, limit);
    }

    private async getRecentComments(limit = 5): Promise<RecentComment[]> {
        const recentComments = await this.commentsService.getRecentComments(limit);

        // Enrich with movie and user data
        const enrichedComments: RecentComment[] = [];

        for (const comment of recentComments) {
            try {
                const movie = await this.movieService.getMovie({ _id: comment.movieId });
                const user = await this.usersService.findById(comment.user._id);

                if (movie && user) {
                    enrichedComments.push({
                        _id: comment._id,
                        content: comment.content,
                        movieId: movie._id.toString(),
                        movieName: movie.name,
                        movieSlug: movie.slug,
                        userName: user.fullName,
                        createdAt: comment.createdAt,
                    });
                }
            } catch (error) {
                // Skip this comment if we can't enrich it
                continue;
            }
        }

        return enrichedComments;
    }

    private async getUserGrowth(days = 7): Promise<UserGrowth[]> {
        const now = new Date();
        const result: UserGrowth[] = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const count = await this.usersService.countUsersByDateRange(date, nextDate);

            result.push({
                date,
                count,
            });
        }

        return result;
    }

    private async getMovieGrowth(days = 7): Promise<MovieGrowth[]> {
        const now = new Date();
        const result: MovieGrowth[] = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const count = await this.movieService.countMoviesByDateRange(date, nextDate);

            result.push({
                date,
                count,
            });
        }

        return result;
    }
}
