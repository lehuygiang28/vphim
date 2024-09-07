import { Field, ObjectType } from '@nestjs/graphql';
import { MovieType } from '../movie.type';

@ObjectType('GetMoviesOutput')
export class GetMoviesOutput {
    @Field(() => [MovieType])
    data: MovieType[];

    @Field()
    total: number;
}
