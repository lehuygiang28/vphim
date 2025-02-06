import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { UserType } from '../users/user.type';

@ObjectType()
export class UserCommentType extends PickType(UserType, ['_id', 'fullName', 'avatar']) {}

@ObjectType()
export class CommentType {
    @Field(() => ID)
    _id: Types.ObjectId;

    @Field(() => UserCommentType)
    user: UserCommentType;

    @Field(() => ID)
    movieId: Types.ObjectId;

    @Field()
    content: string;

    @Field(() => ID, { nullable: true })
    parentComment?: Types.ObjectId | null;

    @Field(() => Number, { nullable: true })
    replyCount?: number | null;

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;

    @Field(() => Number, { nullable: true, defaultValue: null })
    editedAt?: number | null;
}
