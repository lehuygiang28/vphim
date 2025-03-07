import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateCrawlerSettingsInput {
    @Field(() => String)
    name: string;

    @Field(() => String)
    host: string;

    @Field(() => String, { defaultValue: '0 0 * * *' })
    cronSchedule: string;

    @Field(() => Boolean, { defaultValue: false })
    forceUpdate: boolean;

    @Field(() => Boolean, { defaultValue: true })
    enabled: boolean;

    @Field(() => String, { nullable: true, defaultValue: null })
    imgHost?: string;

    @Field(() => Number, { nullable: true, defaultValue: 3 })
    maxRetries?: number;

    @Field(() => Number, { nullable: true, defaultValue: 1000 })
    rateLimitDelay?: number;

    @Field(() => Number, { nullable: true, defaultValue: 5 })
    maxConcurrentRequests?: number;

    @Field(() => Number, { nullable: true, defaultValue: 10 })
    maxContinuousSkips?: number;
}
