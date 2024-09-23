import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class GetMovieInput {
    @Field({ nullable: true })
    slug?: string;

    @Field({ nullable: true })
    _id?: string;
}
