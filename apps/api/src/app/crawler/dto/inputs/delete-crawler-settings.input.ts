import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class DeleteCrawlerSettingsInput {
    @Field(() => String)
    _id: string;
}
