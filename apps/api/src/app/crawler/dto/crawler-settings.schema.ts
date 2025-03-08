import { ApiProperty } from '@nestjs/swagger';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

import { AbstractDocument } from '../../../libs/abstract/abstract.schema';

export type CrawlerSettingsDocument = CrawlerSettings & Document;

/**
 * Enum for crawler types to ensure consistent mapping between configuration and implementation
 */
export enum CrawlerType {
    OPHIM = 'OPHIM',
    KKPHIM = 'KKPHIM',
    NGUONC = 'NGUONC',
}

@Schema({ timestamps: true, collection: 'crawler_settings' })
export class CrawlerSettings extends AbstractDocument {
    @ApiProperty()
    @Prop({ required: true, type: String, unique: true })
    name: string;

    @ApiProperty()
    @Prop({ required: true, type: String, enum: CrawlerType })
    type: CrawlerType;

    @ApiProperty()
    @Prop({ required: true, type: String })
    host: string;

    @ApiProperty()
    @Prop({ required: true, type: String, default: '0 0 * * *' })
    cronSchedule: string;

    @ApiProperty()
    @Prop({ required: true, type: Boolean, default: false })
    forceUpdate: boolean;

    @ApiProperty()
    @Prop({ required: true, type: Boolean, default: true })
    enabled: boolean;

    @ApiProperty()
    @Prop({ required: false, type: String })
    imgHost?: string;

    @ApiProperty()
    @Prop({ required: false, type: Number, default: 3 })
    maxRetries?: number;

    @ApiProperty()
    @Prop({ required: false, type: Number, default: 1000 })
    rateLimitDelay?: number;

    @ApiProperty()
    @Prop({ required: false, type: Number, default: 5 })
    maxConcurrentRequests?: number;

    @ApiProperty()
    @Prop({ required: false, type: Number, default: 10 })
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
