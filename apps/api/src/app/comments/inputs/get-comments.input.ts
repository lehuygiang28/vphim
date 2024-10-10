import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { PaginationInput } from 'apps/api/src/libs/inputs/pagination.input';
import { IsMongoId, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

@InputType()
export class GetCommentsInput extends PartialType(PaginationInput) {
    @Field(() => ID)
    @IsNotEmpty()
    @IsMongoId()
    movieId: string;

    @Field(() => Number, { nullable: true })
    @IsOptional()
    @IsNumber()
    replyPage = 1;

    @Field(() => Number, { nullable: true })
    @IsOptional()
    @IsNumber()
    replyLimit = 5;
}
