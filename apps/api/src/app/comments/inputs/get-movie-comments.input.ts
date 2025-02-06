import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsMongoId, IsNotEmpty } from 'class-validator';

import { PaginationInput } from 'apps/api/src/libs/inputs/pagination.input';

@InputType()
export class GetCommentsInput extends PartialType(PaginationInput) {
    @Field(() => ID)
    @IsNotEmpty()
    @IsMongoId()
    movieId: string;
}
