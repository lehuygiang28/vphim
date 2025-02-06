import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PipelineStage } from 'mongoose';
import { stripHtml } from 'string-strip-html';

import { CommentRepository } from './comments.repository';
import { UsersService } from '../users/users.service';
import { MovieService } from '../movies/movie.service';
import { CreateCommentInput, UpdateCommentInput, GetCommentsInput } from './inputs';
import { UserJwt } from '../auth';
import { CommentType } from './comment.type';
import { Comment } from './comment.schema';
import { convertToObjectId } from '../../libs/utils/common';
import { GetCommentsOutput } from './outputs/get-movie-comments.output';
import { GetCommentRepliesOutput } from './outputs/get-comment-replies.output';
import { GetCommentRepliesInput } from './inputs/get-comment-replies.input';

@Injectable()
export class CommentService {
    private readonly logger = new Logger(CommentService.name);

    constructor(
        private readonly commentRepository: CommentRepository,
        private readonly usersService: UsersService,
        private readonly movieService: MovieService,
    ) {}

    private throwError(message: string, status = HttpStatus.UNPROCESSABLE_ENTITY): never {
        throw new HttpException(
            { status, errors: { message } },
            status,
        );
    }

    private throwMovieNotFoundError(): never {
        this.throwError('Movie not found', HttpStatus.NOT_FOUND);
    }

    private throwCommentNotFoundError(): never {
        this.throwError('Comment not found', HttpStatus.NOT_FOUND);
    }

    private throwUnauthorizedError(): never {
        this.throwError('Unauthorized to perform this action', HttpStatus.UNAUTHORIZED);
    }

    private userLookupStage(): PipelineStage {
        return {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'user',
            },
        };
    }

    private addMovieIdField(): PipelineStage {
        return { $addFields: { movieId: '$movie' } };
    }

    private formatCommentsOutput(comments: CommentType[], total: number, page: number, limit: number): GetCommentsOutput {
        return {
            data: comments,
            total,
            count: comments.length,
            hasMore: total > page * limit,
            currentPage: page,
        };
    }

    private formatRepliesOutput(replies: CommentType[], total: number, page: number, limit: number): GetCommentRepliesOutput {
        return {
            data: replies,
            total,
            count: replies.length,
            hasMore: total > page * limit,
            currentPage: page,
        };
    }

    async createComment(
        actor: UserJwt,
        { movieId, content, parentCommentId = null }: CreateCommentInput,
    ): Promise<Comment> {
        try {
            const [user, movie] = await Promise.all([
                this.usersService.findByIdOrThrow(actor.userId),
                this.movieService.getMovie({ _id: movieId }),
            ]);

            if (!movie) this.throwMovieNotFoundError();

            if (parentCommentId) {
                const parentComment = await this.commentRepository.findOne({
                    filterQuery: { _id: convertToObjectId(parentCommentId), movie: movie._id },
                });
                if (!parentComment) this.throwCommentNotFoundError();
            }

            const [newComment] = await Promise.all([
                this.commentRepository.create({
                    document: {
                        user: user._id,
                        movie: movie._id,
                        replyCount: 0,
                        editedAt: 0,
                        content: stripHtml(content).result,
                        parentComment: parentCommentId ? convertToObjectId(parentCommentId) : null,
                    },
                }),
                parentCommentId &&
                    this.commentRepository.findOneAndUpdate({
                        filterQuery: { _id: convertToObjectId(parentCommentId) },
                        updateQuery: { $inc: { replyCount: 1 } },
                    }),
            ]);

            // Return the complete comment with user data
            const populatedComment = await this.commentRepository.aggregate<CommentType>([
                { $match: { _id: newComment._id } },
                this.userLookupStage(),
                { $unwind: '$user' },
                this.addMovieIdField(),
                {
                    $project: {
                        _id: 1,
                        content: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        editedAt: 1,
                        replyCount: 1,
                        movieId: 1,
                        parentComment: 1,
                        user: {
                            _id: 1,
                            fullName: 1,
                            avatar: 1,
                        },
                    },
                },
            ]);

            return populatedComment[0];
        } catch (error) {
            this.logger.error('Error creating comment:', error);
            if (error instanceof HttpException) throw error;
            throw new HttpException('Error creating comment', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateComment({ _id: commentId, content }: UpdateCommentInput, actor: UserJwt): Promise<Comment> {
        try {
            const comment = await this.commentRepository.findOne({
                filterQuery: {
                    _id: convertToObjectId(commentId),
                    user: convertToObjectId(actor.userId),
                },
            });

            if (!comment) this.throwCommentNotFoundError();
            if (comment.user.toString() !== actor.userId) this.throwUnauthorizedError();

            const [updatedComment] = await Promise.all([
                this.commentRepository.upsert(
                    { _id: convertToObjectId(commentId) },
                    { content: stripHtml(content).result, editedAt: new Date().getTime() },
                ),
            ]);

            return updatedComment;
        } catch (error) {
            this.logger.error('Error updating comment:', error);
            if (error instanceof HttpException) throw error;
            throw new HttpException('Error updating comment', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteComment(commentId: string, actor: UserJwt): Promise<boolean> {
        try {
            const comment = await this.commentRepository.findOne({
                filterQuery: {
                    _id: convertToObjectId(commentId),
                    user: convertToObjectId(actor.userId),
                },
            });

            if (!comment) this.throwCommentNotFoundError();
            if (comment.user.toString() !== actor.userId) this.throwUnauthorizedError();

            await Promise.all([
                // Delete all replies to this comment
                this.commentRepository.deleteMany({
                    filterQuery: { parentComment: convertToObjectId(comment._id) },
                }),
                this.commentRepository.deleteOne({ _id: convertToObjectId(commentId) }),
                comment.parentComment &&
                    this.commentRepository.findOneAndUpdate({
                        filterQuery: { _id: convertToObjectId(comment.parentComment) },
                        updateQuery: { $inc: { replyCount: -1 } },
                    }),
            ]);

            return true;
        } catch (error) {
            this.logger.error('Error deleting comment:', error);
            if (error instanceof HttpException) throw error;
            throw new HttpException('Error deleting comment', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getTopLevelComments(query: GetCommentsInput): Promise<GetCommentsOutput> {
        try {
            const movie = await this.movieService.getMovie({ _id: query.movieId });
            if (!movie) this.throwMovieNotFoundError();

            const { limit = 10, page = 1 } = query;

            const pipeline: PipelineStage[] = [
                { $match: { movie: movie._id, parentComment: null } },
                { $sort: { createdAt: -1 } },
                { $skip: (page - 1) * limit },
                { $limit: limit },
                this.userLookupStage(),
                { $unwind: '$user' },
                this.addMovieIdField(),
                {
                    $project: {
                        _id: 1,
                        content: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        editedAt: 1,
                        replyCount: 1,
                        movieId: 1,
                        user: {
                            _id: 1,
                            fullName: 1,
                            avatar: 1,
                        },
                    },
                },
            ];

            const [comments, total] = await Promise.all([
                this.commentRepository.aggregate<CommentType>(pipeline) as unknown as CommentType[],
                this.commentRepository.count({ movie: movie._id, parentComment: null }),
            ]);

            const result = this.formatCommentsOutput(comments, total, page, limit);
            return result;
        } catch (error) {
            this.logger.error('Error getting movie comments:', error);
            if (error instanceof HttpException) throw error;
            throw new HttpException('Error fetching comments', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getCommentReplies(query: GetCommentRepliesInput): Promise<GetCommentRepliesOutput> {
        try {
            const parentComment = await this.commentRepository.findOne({
                filterQuery: { _id: convertToObjectId(query.parentCommentId) },
            });
            if (!parentComment) this.throwCommentNotFoundError();

            const { limit = 5, page = 1 } = query;

            const pipeline: PipelineStage[] = [
                {
                    $match: {
                        parentComment: convertToObjectId(query.parentCommentId),
                        movie: convertToObjectId(query.movieId),
                    },
                },
                // Sort by newest first for consistency
                { $sort: { createdAt: -1 } },
                { $skip: (page - 1) * limit },
                { $limit: limit },
                this.userLookupStage(),
                { $unwind: '$user' },
                this.addMovieIdField(),
                {
                    $project: {
                        _id: 1,
                        content: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        editedAt: 1,
                        movieId: 1,
                        parentComment: 1,
                        user: {
                            _id: 1,
                            fullName: 1,
                            avatar: 1,
                        },
                    },
                },
            ];

            const [replies, total] = await Promise.all([
                this.commentRepository.aggregate<CommentType>(pipeline) as unknown as CommentType[],
                this.commentRepository.count({
                    parentComment: convertToObjectId(query.parentCommentId),
                }),
            ]);

            const result = this.formatRepliesOutput(replies, total, page, limit);
            return result;
        } catch (error) {
            this.logger.error('Error getting comment replies:', error);
            if (error instanceof HttpException) throw error;
            throw new HttpException('Error fetching replies', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
