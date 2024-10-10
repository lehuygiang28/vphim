import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { stripHtml } from 'string-strip-html';

import { CommentRepository } from './comments.repository';
import { UsersService } from '../users/users.service';
import { MovieService } from '../movies/movie.service';
import { CreateCommentInput, UpdateCommentInput, GetCommentsInput } from './inputs';
import { UserJwt } from '../auth';
import { CommentType } from './comment.type';
import { Comment } from './comment.schema';
import { convertToObjectId, sortedStringify } from '../../libs/utils/common';
import { RedisService } from '../../libs/modules/redis/services';
import { GetCommentsOutput } from './outputs/get-movie-comments.output';

@Injectable()
export class CommentService {
    private readonly logger = new Logger(CommentService.name);

    constructor(
        private readonly commentRepository: CommentRepository,
        private readonly usersService: UsersService,
        private readonly movieService: MovieService,
        private readonly redisService: RedisService,
    ) {}

    async createComment(
        actor: UserJwt,
        { movieId, content, parentCommentId = null }: CreateCommentInput,
    ) {
        const user = await this.usersService.findByIdOrThrow(actor.userId);
        const movie = await this.movieService.getMovie({ _id: movieId });

        if (!movie) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        movie: 'notFoundMovie',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        if (parentCommentId) {
            await this.commentRepository.findOneOrThrow({
                filterQuery: { _id: convertToObjectId(parentCommentId), movie: movie._id },
            });
        }

        const newComment = await this.commentRepository.create({
            document: {
                user: user._id,
                movie: movie._id,
                content: stripHtml(content).result,
                parentComment: parentCommentId ? convertToObjectId(parentCommentId) : null,
            },
        });

        // Invalidate cache
        await this.redisService.del(`CACHED:COMMENTS:${movie.slug}*`);

        return newComment;
    }

    async updateComment({ _id: commentId, content }: UpdateCommentInput, actor: UserJwt) {
        const comment = await this.commentRepository.findOneOrThrow({
            filterQuery: { _id: convertToObjectId(commentId), user: actor.userId },
        });

        const updatedComment = await this.commentRepository.findOneAndUpdate({
            filterQuery: { _id: commentId },
            updateQuery: { content: stripHtml(content).result },
        });

        // Invalidate cache
        await this.redisService.del(`CACHED:COMMENTS:${comment.movie}*`);

        return updatedComment;
    }

    async deleteComment(actor: UserJwt, commentId: string) {
        const comment = await this.commentRepository.findOneOrThrow({
            filterQuery: {
                _id: convertToObjectId(commentId),
                user: convertToObjectId(actor.userId),
            },
        });

        // Delete all replies to this comment
        await this.commentRepository.deleteMany({
            filterQuery: { parentComment: comment?._id },
        });

        await this.commentRepository.deleteOne({ _id: commentId });

        // Invalidate cache
        await this.redisService.del(`CACHED:COMMENTS:${comment.movie}*`);

        return true;
    }

    async getMovieComments(query: GetCommentsInput) {
        const cacheKey = `CACHED:COMMENTS:${query?.movieId}:${sortedStringify(query)}`;

        let fromCache = await this.redisService.get<GetCommentsOutput>(cacheKey);
        if (fromCache) {
            fromCache = {
                ...fromCache,
                data: fromCache.data.map((comment) => ({
                    ...comment,
                    createdAt: new Date(comment.createdAt),
                    updatedAt: new Date(comment.updatedAt),
                    replies: {
                        ...comment.replies,
                        data:
                            comment?.replies?.data.map((reply) => ({
                                ...reply,
                                createdAt: new Date(reply.createdAt),
                                updatedAt: new Date(reply.updatedAt),
                            })) || [],
                    },
                })),
            };
            return fromCache;
        }

        const movie = await this.movieService.getMovie({ _id: query.movieId });

        if (!movie) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        movie: 'notFoundMovie',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        const filters: FilterQuery<Comment> = { movie: movie._id, parentComment: null };

        const [comments, total] = await Promise.all([
            this.commentRepository.find({
                filterQuery: { ...filters },
                query,
                queryOptions: {
                    populate: [{ path: 'user', select: 'fullName avatar' }],
                    sort: { createdAt: -1 },
                },
            }),
            this.commentRepository.count(filters),
        ]);

        const { replyLimit, replyPage } = query;
        // Fetch replies for each comment
        const commentsWithReplies = await Promise.all(
            comments.map(async (comment) => {
                const replies = await this.commentRepository.find({
                    filterQuery: { parentComment: comment._id },
                    query: { limit: replyLimit, page: replyPage },
                    queryOptions: {
                        populate: [{ path: 'user', select: '_id fullName avatar' }],
                        sort: { createdAt: 1 },
                    },
                });
                return {
                    ...comment,
                    replies: {
                        total: replies?.length || 0,
                        count: replies?.length || 0,
                        data: replies || [],
                    },
                };
            }),
        );

        const result = {
            data: commentsWithReplies,
            total,
            count: commentsWithReplies?.length || 0,
        };

        await this.redisService.set(cacheKey, result, 1000); // Cache for 1 second

        return result as unknown as CommentType;
    }
}
