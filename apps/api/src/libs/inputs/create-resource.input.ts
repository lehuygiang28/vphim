import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, Matches } from 'class-validator';

@InputType()
export class CreateResourceInput {
    @Field()
    @IsNotEmpty()
    name: string;

    @Field({ nullable: true })
    originalName?: string;

    @Field()
    @IsNotEmpty()
    @Matches(/^[a-z0-9-]+$/, {
        message: 'Slug can only contain lowercase letters, numbers, and hyphens',
    })
    slug: string;
}
