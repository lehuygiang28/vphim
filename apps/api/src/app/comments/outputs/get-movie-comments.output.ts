import { Field, ObjectType } from '@nestjs/graphql';
import { CommentType } from '../comment.type';

@ObjectType()
export class GetCommentsOutput {
    @Field(() => [CommentType])
    data: CommentType[];

    @Field()
    total: number;

    @Field()
    count: number;
}
