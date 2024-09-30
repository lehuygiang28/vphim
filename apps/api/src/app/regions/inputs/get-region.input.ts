import { Field, InputType } from '@nestjs/graphql';
import { IsMongoId, IsNotEmpty } from 'class-validator';

@InputType()
export class GetRegionInput {
    @Field(() => String, { nullable: true })
    @IsNotEmpty()
    @IsMongoId()
    _id?: string;

    @Field(() => String, { nullable: true })
    @IsNotEmpty()
    slug?: string;
}