import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import type { Region as OPhimRegion } from 'ophim-js';

import { AbstractDocument } from '../../libs/abstract/abstract.schema';
import { ApiProperty } from '@nestjs/swagger';

export type RegionDocument = HydratedDocument<Region>;

@Schema({ timestamps: true, collection: 'regions' })
export class Region
    extends AbstractDocument
    implements Omit<OPhimRegion, '_id' | 'created_at' | 'updated_at'>
{
    @ApiProperty()
    @Prop({ required: true, type: String })
    name: string;

    @ApiProperty()
    @Prop({ required: true, type: String, unique: true })
    slug: string;
}

export const RegionSchema = SchemaFactory.createForClass(Region);
