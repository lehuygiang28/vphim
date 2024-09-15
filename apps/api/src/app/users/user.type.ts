import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { AvatarDto, UserDto } from './dtos';
import { BlockActivityLog, UserBlockSchema } from './schemas/block.schema';
import { MovieType } from '../movies/movie.type';

@ObjectType()
export class BlockActivityLogType implements BlockActivityLog {
    @Field()
    action: string;

    @Field()
    actionAt: Date;

    @Field(() => ID)
    actionBy: Types.ObjectId;

    @Field()
    note: string;

    @Field()
    reason: string;
}

@ObjectType()
export class UserBlockType implements UserBlockSchema {
    @Field()
    isBlocked: boolean;

    @Field(() => [BlockActivityLogType], { nullable: true })
    activityLogs: BlockActivityLogType[];
}

@ObjectType()
export class AvatarType implements AvatarDto {
    @Field({ nullable: true })
    url: string;
}

@ObjectType()
export class MovieFollowType extends PickType(MovieType, ['slug', '_id', 'name']) {
    @Field(() => ID)
    _id: Types.ObjectId;

    @Field()
    name: string;

    @Field()
    slug: string;
}

@ObjectType()
export class UserType implements UserDto {
    @Field(() => ID)
    _id: Types.ObjectId;

    @Field()
    email: string;

    @Field()
    createdAt?: Date;

    @Field()
    emailVerified: boolean;

    @Field()
    fullName: string;

    @Field()
    password: string;

    @Field()
    role: string;

    @Field()
    updatedAt?: Date;

    @Field(() => AvatarType, { nullable: true })
    avatar?: AvatarType;

    @Field(() => UserBlockType, { nullable: true })
    block?: UserBlockType;

    @Field(() => [MovieFollowType], { nullable: true })
    followMovies?: MovieFollowType[];
}
