import { Field, InputType } from '@nestjs/graphql';
import { CrawlerType } from '../crawler-settings.schema';

@InputType()
export class CreateCrawlerSettingsInput {
    @Field(() => String)
    name: string;

    @Field(() => String)
    type: CrawlerType;

    @Field(() => String)
    host: string;

    @Field(() => String, { nullable: true })
    cronSchedule?: string;

    @Field(() => Boolean, { nullable: true })
    forceUpdate?: boolean;

    @Field(() => Boolean, { nullable: true })
    enabled?: boolean;

    @Field(() => String, { nullable: true })
    imgHost?: string;

    @Field(() => Number, { nullable: true })
    maxRetries?: number;

    @Field(() => Number, { nullable: true })
    rateLimitDelay?: number;

    @Field(() => Number, { nullable: true })
    maxConcurrentRequests?: number;

    @Field(() => Number, { nullable: true })
    maxContinuousSkips?: number;
}
