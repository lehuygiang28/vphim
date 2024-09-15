import { Field, InputType, PickType } from '@nestjs/graphql';

@InputType()
export class MutationFollowMovieInput {
    @Field()
    movieSlug: string;
}

@InputType()
export class MutationUnfollowMovieInput extends PickType(MutationFollowMovieInput, ['movieSlug']) {}
