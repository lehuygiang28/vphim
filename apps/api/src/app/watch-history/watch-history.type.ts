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

    @Field({ nullable: true, description: 'Display name of the episode for UI' })
    episodeName: string;

    @Field({ nullable: true, description: 'Slug of the episode for navigation' })
    episodeSlug: string;

    @Field({ description: 'Display name of the server' })
    serverName: string;

    @Field({ description: 'Server identifier/index used for playback' })
    serverIndex: number;

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
