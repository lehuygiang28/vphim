import { Field, ObjectType } from '@nestjs/graphql';

import { CrawlerSettingsType } from '../crawler-settings.type';

@ObjectType()
export class GetCrawlerSettingsOutput {
    @Field(() => [CrawlerSettingsType])
    data: CrawlerSettingsType[];

    @Field(() => Number)
    total: number;
}
