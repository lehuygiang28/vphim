import { Field, InputType } from '@nestjs/graphql';
import { IsMongoId, IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateResourceInput {
    @Field()
    @IsMongoId()
    _id: string;

    @Field()
    @IsNotEmpty()
    name: string;

    @Field({ nullable: true })
    slug?: string;

    @Field({ nullable: true })
    originalName?: string;

    @Field({ nullable: true })
    posterUrl?: string;
}
