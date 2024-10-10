import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { CommentType } from './comment.type';
import { CommentService } from './comments.service';
import { CreateCommentInput, GetCommentsInput, UpdateCommentInput } from './inputs';
import { RequiredRoles } from '../auth/guards/auth.guard';
import { CurrentUser, UserJwt } from '../auth';
import { GetCommentsOutput } from './outputs/get-movie-comments.output';

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
    deleteComment(@Args('id') id: string, @CurrentUser() actor: UserJwt) {
        return this.commentService.deleteComment(actor, id);
    }

    @Query(() => GetCommentsOutput, { name: 'movieComments' })
    getMovieComments(@Args('input') query: GetCommentsInput) {
        return this.commentService.getMovieComments(query);
    }
}
