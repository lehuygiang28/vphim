import { InputType, Field, IntersectionType } from '@nestjs/graphql';
import { GetMoviesInput } from './get-movies.input';

@InputType()
export class GetMoviesAdminInput extends IntersectionType(GetMoviesInput, GetMoviesInput) {
    @Field({ nullable: true })
    resetCache?: boolean;

    @Field({ nullable: true })
    isDeleted?: boolean;

    @Field({ nullable: true })
    bypassCache?: boolean;
}
