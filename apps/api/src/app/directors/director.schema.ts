import { ApiProperty } from '@nestjs/swagger';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

import { AbstractDocument } from '../../libs/abstract/abstract.schema';

export type DirectorDocument = HydratedDocument<Director>;

@Schema({ timestamps: true, collection: 'directors' })
export class Director extends AbstractDocument {
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

export const DirectorSchema = SchemaFactory.createForClass(Director);
