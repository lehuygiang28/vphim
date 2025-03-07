import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class TriggerCrawlerInput {
    @Field(() => String)
    name: string;

    @Field(() => String, { nullable: true })
    slug?: string;
}
