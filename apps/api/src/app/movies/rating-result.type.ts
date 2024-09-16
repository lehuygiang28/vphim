import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RatingResultType {
    @Field({ nullable: true })
    id?: string;

    @Field({ nullable: true })
    voteAverage?: number;

    @Field({ nullable: true })
    voteCount?: number;
}
