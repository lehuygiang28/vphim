import { Field, InputType, PartialType } from '@nestjs/graphql';

import { PaginationInput } from 'apps/api/src/libs/inputs/pagination.input';
import { IsMongoId, IsOptional } from 'class-validator';

@InputType()
export class GetCategoriesInput extends PartialType(PaginationInput) {
    @Field({ nullable: true })
    @IsOptional()
    keywords?: string;

    @Field(() => [String], { nullable: true })
    @IsOptional()
    @IsMongoId({ each: true })
    ids?: string[];

    @Field(() => [String], { nullable: true })
    @IsOptional()
    slugs?: string[];
}
