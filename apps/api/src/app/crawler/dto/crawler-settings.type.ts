import { Field, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';

@ObjectType()
export class CrawlerSettingsType {
    @Field(() => String)
    _id: string;

    @Field(() => String)
    name: string;

    @Field(() => String)
    host: string;

    @Field(() => String)
    cronSchedule: string;

    @Field(() => Boolean)
    forceUpdate: boolean;

    @Field(() => Boolean)
    enabled: boolean;

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

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;
}
