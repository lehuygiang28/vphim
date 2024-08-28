import { ApiProperty } from '@nestjs/swagger';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Movie as OPhimMovie } from 'ophim-js';

import { AbstractDocument } from '../../libs/abstract/abstract.schema';

export type MovieDocument = HydratedDocument<Movie>;

@Schema({ timestamps: true, collection: 'categories' })
export class Movie
    extends AbstractDocument
    implements
        Pick<
            OPhimMovie,
            | 'name'
            | 'content'
            | 'type'
            | 'status'
            | 'time'
            | 'quality'
            | 'lang'
            | 'notify'
            | 'showtimes'
            | 'slug'
            | 'year'
            | 'view'
            | 'country'
        >
{
    @ApiProperty()
    @Prop({ required: true, type: String })
    name: string;

    @ApiProperty()
    @Prop({ required: true, type: String, unique: true })
    slug: string;

    @ApiProperty()
    @Prop({ type: String, default: '' })
    originName?: string;

    @ApiProperty()
    @Prop({ type: String, default: '' })
    content?: string;

    @ApiProperty()
    @Prop({ type: String, default: '' })
    type: string;

    @ApiProperty()
    @Prop({ type: String, default: '' })
    lang?: string;

    @ApiProperty()
    @Prop({ type: String, default: '' })
    notify?: string;

    @ApiProperty()
    @Prop({ type: String, default: '' })
    quality?: string;

    @ApiProperty()
    @Prop({ type: String, default: '' })
    showtimes?: string;

    @ApiProperty()
    @Prop({ type: String, default: '' })
    status: string;

    @ApiProperty()
    @Prop({ type: String, default: '' })
    time?: string;

    @Prop({ type: Types.ObjectId, default: [], ref: 'Actor' })
    actors?: Types.ObjectId[];

    @Prop({ type: Types.ObjectId, default: [], ref: 'Director' })
    directors?: Types.ObjectId[];

    @Prop({ type: Types.ObjectId, default: [], ref: 'Category' })
    categories?: Types.ObjectId[];
}

export const MovieSchema = SchemaFactory.createForClass(Movie);
