import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class GetMovieInput {
    @Field({ nullable: false })
    slug: string;
}
