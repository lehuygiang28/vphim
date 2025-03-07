import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class GetCrawlerSettingsInput {
    @Field(() => String, { nullable: true })
    name?: string;

    @Field(() => Int, { nullable: true, defaultValue: 1 })
    page?: number;

    @Field(() => Int, { nullable: true, defaultValue: 20 })
    limit?: number;

    @Field(() => String, { nullable: true })
    search?: string;
}

@InputType()
export class GetCrawlerSettingInput {
    @Field(() => String, { nullable: true })
    _id?: string;

    @Field(() => String, { nullable: true })
    name?: string;
}
