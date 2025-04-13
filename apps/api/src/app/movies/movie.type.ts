import { ObjectType, Field, ID, InputType } from '@nestjs/graphql';
import { Types } from 'mongoose';

import { Episode, EpisodeServerData, LastSyncModified, Movie } from './movie.schema';
import { ActorType } from '../actors';
import { CategoryType } from '../categories';
import { RegionType } from '../regions/region.type';
import { DirectorType } from '../directors/director.type';
import { MovieContentRatingEnum } from './movie.constant';

@InputType('EpisodeServerDataInputType')
@ObjectType('EpisodeServerData')
export class EpisodeServerDataType implements EpisodeServerData {
    @Field({ nullable: true })
    slug: string;

    @Field({ nullable: true })
    name: string;

    @Field({ nullable: true })
    filename: string;

    @Field({ nullable: true })
    linkM3u8: string;

    @Field({ nullable: true })
    linkEmbed: string;
}

@InputType('EpisodeInputType')
@ObjectType('Episode')
export class EpisodeType implements Episode {
    @Field(() => [EpisodeServerDataType], { nullable: true })
    serverData: EpisodeServerDataType[];

    @Field({ nullable: true })
    originSrc?: string;

    @Field({ nullable: true })
    serverName: string;
}

@InputType('TmdbInputType')
@ObjectType()
export class TmdbType {
    @Field({ nullable: true })
    type: 'tv' | 'movie' | null | string;

    @Field({ nullable: true })
    id?: string;

    @Field({ nullable: true })
    season?: number | null;

    @Field({ nullable: true })
    voteAverage?: number;

    @Field({ nullable: true })
    voteCount?: number;
}

@InputType('ImdbInputType')
@ObjectType()
export class ImdbType {
    @Field({ nullable: true })
    id?: string;
}

@InputType('LastSyncModifiedInputType')
@ObjectType()
export class LastSyncModifiedType implements LastSyncModified {
    @Field({ nullable: true })
    ophim?: number;

    @Field({ nullable: true })
    kkphim?: number;

    @Field({ nullable: true })
    nguonc?: number;
}

@ObjectType('Movie')
export class MovieType
    implements
        Omit<
            Movie,
            'actors' | 'categories' | 'countries' | 'directors' | 'tmdb' | 'imdb' | 'contentRating'
        >
{
    constructor(movie: MovieType) {
        Object.assign(this, movie);
        this.updatedAt = movie?.updatedAt ? new Date(movie?.updatedAt) : null;
        this.createdAt = movie?.createdAt ? new Date(movie?.createdAt) : null;
        this.posterUrl = movie?.posterUrl || '';
    }

    @Field(() => ID)
    _id: Types.ObjectId;

    @Field()
    name: string;

    @Field(() => [ActorType], { nullable: true })
    actors?: ActorType[];

    @Field(() => [CategoryType], { nullable: true })
    categories?: CategoryType[];

    @Field({ nullable: true })
    cinemaRelease?: boolean;

    @Field({ nullable: true })
    content?: string;

    @Field(() => [RegionType], { nullable: true })
    countries?: RegionType[];

    @Field(() => Date, { nullable: true })
    createdAt?: Date;

    @Field(() => [DirectorType], { nullable: true })
    directors?: DirectorType[];

    @Field(() => [EpisodeType], { nullable: true })
    episode?: EpisodeType[];

    @Field({ nullable: true })
    episodeCurrent: string;

    @Field({ nullable: true })
    episodeTotal: string;

    @Field({ nullable: true })
    isCopyright: boolean;

    @Field({ nullable: true })
    lang?: string;

    @Field(() => LastSyncModifiedType, { nullable: true })
    lastSyncModified?: LastSyncModifiedType;

    @Field({ nullable: true })
    notify?: string;

    @Field({ nullable: true })
    originName?: string;

    @Field({ nullable: true })
    quality?: string;

    @Field({ nullable: true })
    showtimes?: string;

    @Field()
    slug: string;

    @Field({ nullable: true })
    status: string;

    @Field()
    contentRating: string;

    @Field({ nullable: true })
    subDocquyen?: boolean;

    @Field()
    thumbUrl: string;

    @Field({ nullable: true })
    posterUrl: string;

    @Field({ nullable: true })
    time?: string;

    @Field({ nullable: true })
    trailerUrl?: string;

    @Field()
    type: string;

    @Field(() => Date, { nullable: true })
    updatedAt?: Date;

    @Field({ nullable: true })
    view?: number;

    @Field({ nullable: true })
    year?: number;

    @Field(() => ImdbType, { nullable: true })
    imdb?: ImdbType;

    @Field(() => TmdbType, { nullable: true })
    tmdb?: TmdbType;

    @Field({ nullable: true })
    deletedAt?: Date;
}
