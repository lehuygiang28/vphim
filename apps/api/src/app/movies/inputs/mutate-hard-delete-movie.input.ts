import { InputType, PickType } from '@nestjs/graphql';
import { UpdateMovieInput } from './mutate-movie.input';

@InputType()
export class MutateHardDeleteMovieInput extends PickType(UpdateMovieInput, ['_id']) {}
