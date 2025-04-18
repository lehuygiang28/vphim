import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class GetWatchHistoryInput {
    @Field(() => Int, { nullable: true, defaultValue: 10 })
    limit?: number;

    @Field(() => Int, { nullable: true, defaultValue: 0 })
    offset?: number;
}

@InputType()
export class GetMovieWatchHistoryInput {
    @Field()
    movieId: string;
}

@InputType()
export class DeleteWatchHistoryInput {
    @Field()
    watchHistoryId: string;
}
