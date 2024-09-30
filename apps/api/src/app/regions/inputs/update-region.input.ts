import { Field, InputType } from '@nestjs/graphql';
import { IsMongoId, IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateRegionInput {
    @Field()
    @IsMongoId()
    _id: string;

    @Field()
    @IsNotEmpty()
    name: string;

    @Field({ nullable: true })
    slug?: string;
}
