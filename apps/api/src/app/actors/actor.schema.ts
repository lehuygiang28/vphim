import { ApiProperty } from '@nestjs/swagger';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

import { AbstractDocument } from '../../libs/abstract/abstract.schema';

export type ActorDocument = HydratedDocument<Actor>;

@Schema({ timestamps: true, collection: 'actors' })
export class Actor extends AbstractDocument {
    @ApiProperty()
    @Prop({ required: true, type: String })
    name: string;

    @ApiProperty()
    @Prop({ required: true, type: String, unique: true })
    slug: string;

    @ApiProperty()
    @Prop({ type: String, default: null })
    content?: string;

    @ApiProperty()
    @Prop({ type: String, default: null })
    thumbUrl?: string;

    @ApiProperty()
    @Prop({ type: String, default: null })
    posterUrl?: string;
}

export const ActorSchema = SchemaFactory.createForClass(Actor);

ActorSchema.pre('save', function () {
    this.set({ updatedAt: new Date(), createdAt: new Date() });
});

ActorSchema.pre('updateOne', function () {
    this.set({ updatedAt: new Date() });
});

ActorSchema.pre('findOneAndUpdate', function () {
    this.set({ updatedAt: new Date() });
});
