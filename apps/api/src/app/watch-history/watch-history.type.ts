import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { WatchProgress } from './schemas';
import { MovieType } from '../movies/movie.type';

@ObjectType()
export class WatchProgressType implements WatchProgress {
    @Field()
    currentTime: number;

    @Field()
    duration: number;

    @Field()
    completed: boolean;
}

@ObjectType()
export class WatchHistoryType {
    @Field(() => ID)
    _id: Types.ObjectId;

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;

    @Field(() => ID)
    userId: Types.ObjectId;

    @Field(() => MovieType)
    movieId: MovieType;

    @Field({ nullable: true })
    episodeName: string;

    @Field()
    serverName: string;

    @Field()
    serverSlug: string;

    @Field(() => WatchProgressType)
    progress: WatchProgressType;

    @Field(() => Date)
    lastWatched: Date;
}

@ObjectType()
export class GetWatchHistoryOutput {
    @Field(() => Int)
    total: number;

    @Field(() => [WatchHistoryType])
    data: WatchHistoryType[];
}
