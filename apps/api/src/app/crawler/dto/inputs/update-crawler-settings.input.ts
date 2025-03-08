import { Field, InputType } from '@nestjs/graphql';
import { CrawlerType } from '../crawler-settings.schema';

@InputType()
export class UpdateCrawlerSettingsInput {
    @Field(() => String)
    _id: string;

    @Field(() => String, { nullable: true })
    name?: string;

    @Field(() => String, { nullable: true })
    type?: CrawlerType;

    @Field(() => String, { nullable: true })
    host?: string;

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
