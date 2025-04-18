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

    @Field({ nullable: true })
    episodeName?: string;

    @Field()
    serverName: string;

    @Field()
    serverSlug: string;

    @Field(() => WatchProgressInput)
    progress: WatchProgressInput;
}
