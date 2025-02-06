import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { CommentType } from './comment.type';
import { CommentService } from './comments.service';
import {
    CreateCommentInput,
    DeleteCommentInput,
    GetCommentsInput,
    UpdateCommentInput,
} from './inputs';
import { RequiredRoles } from '../auth/guards/auth.guard';
import { CurrentUser, UserJwt } from '../auth';
import { GetCommentsOutput } from './outputs/get-movie-comments.output';
import { GetCommentRepliesOutput } from './outputs/get-comment-replies.output';
import { GetCommentRepliesInput } from './inputs/get-comment-replies.input';

@Resolver(() => CommentType)
export class CommentResolver {
    constructor(private readonly commentService: CommentService) {}

    @RequiredRoles([], { isGql: true })
    @Mutation(() => CommentType, { name: 'createComment' })
    createComment(@Args('input') input: CreateCommentInput, @CurrentUser() actor: UserJwt) {
        return this.commentService.createComment(actor, input);
    }

    @RequiredRoles([], { isGql: true })
    @Mutation(() => CommentType, { name: 'updateComment' })
    updateComment(@Args('input') input: UpdateCommentInput, @CurrentUser() actor: UserJwt) {
        return this.commentService.updateComment(input, actor);
    }

    @RequiredRoles([], { isGql: true })
    @Mutation(() => Boolean, { name: 'deleteComment' })
    deleteComment(@Args('input') query: DeleteCommentInput, @CurrentUser() actor: UserJwt) {
        return this.commentService.deleteComment(query?._id, actor);
    }

    /**
     * Get paginated comments for a movie
     * @param query GetCommentsInput containing movieId and pagination parameters
     * @returns GetCommentsOutput containing paginated comments
     */
    @Query(() => GetCommentsOutput, {
        name: 'movieComments',
        description: 'Get paginated comments for a movie',
    })
    getMovieComments(
        @Args('input', {
            description: 'Input containing movieId and pagination parameters (page, limit)',
        })
        query: GetCommentsInput,
    ) {
        return this.commentService.getTopLevelComments(query);
    }

    /**
     * Get paginated replies for a specific comment
     * @param query GetCommentRepliesInput containing parentCommentId and pagination parameters
     * @returns GetCommentRepliesOutput containing paginated replies
     */
    @Query(() => GetCommentRepliesOutput, {
        name: 'commentReplies',
        description: 'Get paginated replies for a specific comment',
    })
    getCommentReplies(
        @Args('input', {
            description: 'Input containing parentCommentId and pagination parameters (page, limit)',
        })
        query: GetCommentRepliesInput,
    ) {
        return this.commentService.getCommentReplies(query);
    }
}
