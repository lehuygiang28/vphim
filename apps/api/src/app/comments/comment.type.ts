import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { UserType } from '../users/user.type';
import { GetCommentsOutput } from './outputs/get-movie-comments.output';

@ObjectType()
export class UserCommentType extends PickType(UserType, ['_id', 'fullName', 'avatar']) {}

@ObjectType()
export class CommentType {
    @Field(() => ID)
    _id: Types.ObjectId;

    @Field(() => UserCommentType)
    user: UserCommentType;

    @Field(() => ID)
    movie: Types.ObjectId;

    @Field()
    content: string;

    @Field(() => ID, { nullable: true })
    parentComment?: Types.ObjectId;

    @Field(() => GetCommentsOutput, { nullable: true })
    replies?: GetCommentsOutput;

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;
}
