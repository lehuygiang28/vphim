import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class WatchProgressInput {
    @Field()
    currentTime: number;

    @Field()
    duration: number;

    @Field({ nullable: true })
    completed?: boolean;
}

@InputType()
export class SaveWatchHistoryInput {
    @Field()
    movieId: string;

    @Field({ nullable: true, description: 'Display name of the episode for UI' })
    episodeName?: string;

    @Field({ nullable: true, description: 'Slug of the episode for navigation' })
    episodeSlug?: string;

    @Field({ description: 'Display name of the server' })
    serverName: string;

    @Field({ description: 'Server identifier/index used for playback' })
    serverIndex: number;

    @Field(() => WatchProgressInput)
    progress: WatchProgressInput;
}
