import { ApiProperty } from '@nestjs/swagger';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import type { Category as OPhimCategory } from 'ophim-js';

import { AbstractDocument } from '../../libs/abstract/abstract.schema';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true, collection: 'categories' })
export class Category
    extends AbstractDocument
    implements Omit<OPhimCategory, '_id' | 'created_at' | 'updated_at'>
{
    @ApiProperty()
    @Prop({ required: true, type: String })
    name: string;

    @ApiProperty()
    @Prop({ required: true, type: String, unique: true })
    slug: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.pre('save', function () {
    this.set({ updatedAt: new Date(), createdAt: new Date() });
});

CategorySchema.pre('updateOne', function () {
    this.set({ updatedAt: new Date() });
});

CategorySchema.pre('findOneAndUpdate', function () {
    this.set({ updatedAt: new Date() });
});
