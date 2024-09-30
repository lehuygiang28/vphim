import { Field, ID, InputType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { IsMongoId, IsNotEmpty } from 'class-validator';

@InputType()
export class DeleteRegionInput {
    @Field(() => ID)
    @IsNotEmpty()
    @IsMongoId()
    _id: Types.ObjectId;
}
