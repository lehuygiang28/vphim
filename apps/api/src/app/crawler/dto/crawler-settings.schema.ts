import { ApiProperty } from '@nestjs/swagger';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

import { AbstractDocument } from '../../../libs/abstract/abstract.schema';

export type CrawlerSettingsDocument = HydratedDocument<CrawlerSettings>;

@Schema({ timestamps: true, collection: 'crawler_settings' })
export class CrawlerSettings extends AbstractDocument {
    @ApiProperty()
    @Prop({ required: true, type: String, unique: true })
    name: string;

    @ApiProperty()
    @Prop({ required: true, type: String })
    host: string;

    @ApiProperty()
    @Prop({ required: true, type: String })
    cronSchedule: string;

    @ApiProperty()
    @Prop({ required: true, type: Boolean, default: false })
    forceUpdate: boolean;

    @ApiProperty()
    @Prop({ required: false, type: Boolean, default: true })
    enabled: boolean;

    @ApiProperty()
    @Prop({ required: false, type: String })
    imgHost?: string;

    @ApiProperty()
    @Prop({ required: false, type: Number })
    maxRetries?: number;

    @ApiProperty()
    @Prop({ required: false, type: Number })
    rateLimitDelay?: number;

    @ApiProperty()
    @Prop({ required: false, type: Number })
    maxConcurrentRequests?: number;

    @ApiProperty()
    @Prop({ required: false, type: Number })
    maxContinuousSkips?: number;
}

export const CrawlerSettingsSchema = SchemaFactory.createForClass(CrawlerSettings);

CrawlerSettingsSchema.pre('save', function () {
    this.set({ updatedAt: new Date(), createdAt: new Date() });
});

CrawlerSettingsSchema.pre('updateOne', function () {
    this.set({ updatedAt: new Date() });
});

CrawlerSettingsSchema.pre('findOneAndUpdate', function () {
    this.set({ updatedAt: new Date() });
});
