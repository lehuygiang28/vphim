import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsBoolean, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';

import { PaginationInput } from 'apps/api/src/libs/inputs/pagination.input';

@InputType()
export class GetCommentRepliesInput extends PartialType(PaginationInput) {
    @Field(() => ID)
    @IsNotEmpty()
    @IsMongoId()
    parentCommentId: string;

    @Field(() => ID)
    @IsNotEmpty()
    @IsMongoId()
    movieId: string;

    @Field(() => Boolean, { nullable: true, defaultValue: false })
    @IsOptional()
    @IsBoolean()
    includeNestedReplies?: boolean;
}
