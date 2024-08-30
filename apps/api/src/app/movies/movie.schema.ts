import { ApiProperty } from '@nestjs/swagger';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Movie as OPhimMovie, ServerData as OPhimServerData } from 'ophim-js';

import { AbstractDocument } from '../../libs/abstract/abstract.schema';

export type MovieDocument = HydratedDocument<Movie>;

export class EpisodeServerData implements Omit<OPhimServerData, 'link_embed' | 'link_m3u8'> {
    @Prop({ type: String, default: 'default' })
    filename: string;

    @Prop({ type: String, default: 'default' })
    name: string;

    @Prop({ type: String, required: true })
    slug: string;

    @Prop({ type: String, default: null })
    linkEmbed: string;

    @Prop({ type: String, default: null })
    linkM3u8: string;
}

export class Episode {
    @Prop({ required: true, type: String })
    serverName: string;

    @Prop({ required: true, type: [EpisodeServerData] })
    serverData: EpisodeServerData[];
}

@Schema({ timestamps: true, collection: 'movies' })
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

    @ApiProperty()
    @Prop({ type: String, default: '' })
    thumbUrl: string;

    @ApiProperty()
    @Prop({ type: String, default: '' })
    posterUrl: string;

    @ApiProperty()
    @Prop({ type: String, default: '' })
    trailerUrl?: string;

    @ApiProperty()
    @Prop({ type: Boolean, default: false })
    isCopyright: boolean;

    @ApiProperty()
    @Prop({ type: String, default: null })
    episodeCurrent: string;

    @ApiProperty()
    @Prop({ type: String, default: null })
    episodeTotal: string;

    @ApiProperty()
    @Prop({ type: Boolean, default: false })
    subDocquyen?: boolean;

    @ApiProperty()
    @Prop({ type: Boolean, default: false })
    cinemaRelease?: boolean;

    @ApiProperty()
    @Prop({ type: Number, default: null })
    year?: number;

    @ApiProperty()
    @Prop({ type: Number, default: 0 })
    view?: number;

    @Prop({ type: Types.ObjectId, default: [], ref: 'Actor' })
    actors?: Types.ObjectId[];

    @Prop({ type: Types.ObjectId, default: [], ref: 'Director' })
    directors?: Types.ObjectId[];

    @Prop({ type: Types.ObjectId, default: [], ref: 'Category' })
    categories?: Types.ObjectId[];

    @Prop({ type: Types.ObjectId, default: [], ref: 'Region' })
    countries?: Types.ObjectId[];

    @ApiProperty()
    @Prop({ type: [Episode], default: null })
    episode?: Episode[];
}

export const MovieSchema = SchemaFactory.createForClass(Movie);