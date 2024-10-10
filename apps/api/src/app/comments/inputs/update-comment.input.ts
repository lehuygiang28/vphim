import { InputType, Field, ID } from '@nestjs/graphql';
import { IsMongoId, IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateCommentInput {
    @Field(() => ID)
    @IsMongoId()
    @IsNotEmpty()
    _id: string;

    @Field()
    content: string;
}
