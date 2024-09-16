import { Field, ObjectType } from '@nestjs/graphql';
import { RatingResultType } from '../rating-result.type';

@ObjectType()
export class GetRatingOutput {
    @Field(() => RatingResultType, { nullable: true })
    imdb?: RatingResultType;

    @Field(() => RatingResultType, { nullable: true })
    tmdb?: RatingResultType;
}
