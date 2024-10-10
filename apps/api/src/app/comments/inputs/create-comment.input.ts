import { InputType, Field, ID } from '@nestjs/graphql';
import { IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';

@InputType()
export class CreateCommentInput {
    @Field(() => ID)
    @IsNotEmpty()
    @IsMongoId()
    movieId: string;

    @Field()
    content: string;

    @Field(() => ID, { nullable: true })
    @IsOptional()
    @IsMongoId()
    parentCommentId?: string;
}
