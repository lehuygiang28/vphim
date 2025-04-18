import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument, Types } from 'mongoose';

import { AbstractDocument } from '../../../libs/abstract/abstract.schema';

export type WatchHistoryDocument = HydratedDocument<WatchHistory>;

export class WatchProgress {
    @ApiProperty({
        type: Number,
        example: 142.5,
    })
    @Prop({ type: Number, default: 0 })
    currentTime: number;

    @ApiProperty({
        type: Number,
        example: 1800,
    })
    @Prop({ type: Number, default: 0 })
    duration: number;

    @ApiProperty({
        type: Boolean,
        example: false,
    })
    @Prop({ type: Boolean, default: false })
    completed: boolean;
}

@Schema({
    timestamps: true,
    collection: 'watchHistory',
})
export class WatchHistory extends AbstractDocument {
    @ApiProperty({
        type: String,
        example: '507f1f77bcf86cd799439011',
    })
    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId;

    @ApiProperty({
        type: String,
        example: '507f1f77bcf86cd799439011',
    })
    @Prop({ required: true, type: Types.ObjectId, ref: 'Movie' })
    movieId: Types.ObjectId;

    @ApiProperty({
        type: String,
        example: 'Tập 1',
        description: 'Display name of the episode for UI purposes',
    })
    @Prop({ type: String, default: '' })
    episodeName: string;

    @ApiProperty({
        type: String,
        example: 'tap-1',
        description: 'Slug of the episode for navigation purposes',
    })
    @Prop({ type: String, default: '' })
    episodeSlug: string;

    @ApiProperty({
        type: String,
        example: 'Server VIP',
        description: 'Display name of the server',
    })
    @Prop({ type: String, required: true })
    serverName: string;

    @ApiProperty({
        type: String,
        example: 'vip',
        description: 'Server identifier/index used for playback',
    })
    @Prop({ type: String, required: true })
    serverSlug: string;

    @ApiProperty({
        type: WatchProgress,
    })
    @Prop({ type: WatchProgress, default: {} })
    progress: WatchProgress;

    @ApiProperty({
        type: Date,
    })
    @Prop({ type: Date, default: Date.now })
    lastWatched: Date;
}

export const WatchHistorySchema = SchemaFactory.createForClass(WatchHistory);

WatchHistorySchema.pre('save', function () {
    this.set({ updatedAt: new Date(), createdAt: new Date() });
});

WatchHistorySchema.pre('updateOne', function () {
    this.set({ updatedAt: new Date() });
});

WatchHistorySchema.pre('findOneAndUpdate', function () {
    this.set({ updatedAt: new Date() });
});

WatchHistorySchema.index(
    { userId: 1, movieId: 1, episodeSlug: 1, serverName: 1, serverSlug: 1 },
    { unique: true },
);
