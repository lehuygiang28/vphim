import { Field, InputType } from '@nestjs/graphql';
import { GetWatchHistoryInput, GetMovieWatchHistoryInput } from './get-watch-history.input';

@InputType()
export class GetWatchHistoryInputAdmin extends GetWatchHistoryInput {
    @Field(() => String, { nullable: false })
    userId: string;
}

@InputType()
export class GetMovieWatchHistoryInputAdmin extends GetMovieWatchHistoryInput {
    @Field(() => String, { nullable: false })
    userId: string;
}
