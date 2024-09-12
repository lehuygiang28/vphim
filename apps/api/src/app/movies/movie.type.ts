import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Types } from 'mongoose';

import { Episode, EpisodeServerData, Movie } from './movie.schema';
import { ActorType } from '../actors';
import { CategoryType } from '../categories';
import { RegionType } from '../regions/region.type';
import { DirectorType } from '../directors/director.type';

@ObjectType('EpisodeServerData')
class EpisodeServerDataType implements EpisodeServerData {
    @Field()
    slug: string;

    @Field()
    name: string;

    @Field()
    filename: string;

    @Field()
    linkM3u8: string;

    @Field()
    linkEmbed: string;
}

@ObjectType('Episode')
export class EpisodeType implements Episode {
    @Field(() => [EpisodeServerDataType])
    serverData: EpisodeServerDataType[];

    @Field()
    serverName: string;
}

@ObjectType('Movie')
export class MovieType implements Omit<Movie, 'actors' | 'categories' | 'countries' | 'directors'> {
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

    @Field()
    episodeCurrent: string;

    @Field()
    episodeTotal: string;

    @Field()
    isCopyright: boolean;

    @Field({ nullable: true })
    lang?: string;

    @Field(() => Date)
    lastSyncModified: Date;

    @Field({ nullable: true })
    notify?: string;

    @Field({ nullable: true })
    originName?: string;

    @Field()
    posterUrl: string;

    @Field({ nullable: true })
    quality?: string;

    @Field({ nullable: true })
    showtimes?: string;

    @Field()
    slug: string;

    @Field()
    status: string;

    @Field({ nullable: true })
    subDocquyen?: boolean;

    @Field()
    thumbUrl: string;

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
}
