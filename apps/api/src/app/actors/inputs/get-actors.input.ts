import { Field, InputType, PartialType } from '@nestjs/graphql';

import { PaginationInput } from 'apps/api/src/libs/inputs/pagination.input';

@InputType()
export class GetActorsInput extends PartialType(PaginationInput) {
    @Field({ nullable: true })
    keywords?: string;
}
