import { InputType, Field, ID } from '@nestjs/graphql';
import {
    IsEnum,
    IsMongoId,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    Matches,
    ValidateNested,
} from 'class-validator';
import { EpisodeType, TmdbType, ImdbType } from '../movie.type';
import { MovieContentRatingEnum, MovieStatusEnum, MovieTypeEnum } from '../movie.constant';
import { Type } from 'class-transformer';
import { IsOneOfNotEmpty } from 'apps/api/src/libs/decorators/one-of-many-not-empty.decorator';

export class EpisodeServerDataTypeInput {
    @Field()
    @IsNotEmpty({ message: 'Episode name can not be empty' })
    @IsString({ message: 'Episode name can not be empty' })
    name: string;

    @Field()
    @IsNotEmpty({ message: 'Episode slug can not be empty' })
    @IsString({ message: 'Episode slug can not be empty' })
    slug: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    linkM3u8: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    @IsUrl()
    linkEmbed: string;

    @IsOneOfNotEmpty(['linkM3u8', 'linkEmbed'], {
        message: 'At least one of "m3u8 link" or "embed link" must not be empty',
    })
    dummyField: string; // This field is just a placeholder for the custom validation
}

export class EpisodeTypeInput {
    @Field()
    @IsNotEmpty({ message: 'Server name can not be empty' })
    @IsString({ message: 'Server name can not be empty' })
    serverName: string;

    @Field(() => [EpisodeServerDataTypeInput])
    @Type(() => EpisodeServerDataTypeInput)
    @ValidateNested({ each: true })
    serverData: EpisodeServerDataTypeInput[];
}

@InputType()
export class CreateMovieInput {
    @Field()
    @IsNotEmpty({ message: 'Name can not be empty' })
    @IsString({ message: 'Name can not be empty' })
    name: string;

    @Field()
    @IsNotEmpty({ message: 'Slug can not be empty' })
    @IsString({ message: 'Slug can not be empty' })
    @Matches(/^[a-zA-Z0-9-_]+$/, {
        message: 'Slug can only contain alphanumeric characters, hyphens, and underscores',
    })
    slug: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    originName?: string;

    @Field()
    @IsString()
    @IsEnum(MovieContentRatingEnum)
    contentRating: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    content?: string;

    @Field()
    @IsEnum(MovieTypeEnum)
    type: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    lang?: string;

    @Field({ nullable: true })
    @IsOptional()
    quality?: string;

    @Field({ nullable: true })
    @IsOptional()
    showtimes?: string;

    @Field()
    @IsNotEmpty({ message: 'Status can not be empty' })
    @IsEnum(MovieStatusEnum)
    status: string;

    @Field({ nullable: true })
    @IsOptional()
    time?: string;

    @Field()
    @IsNotEmpty({ message: 'Thumb can not be empty' })
    @IsUrl()
    thumbUrl: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsUrl()
    posterUrl: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsUrl()
    trailerUrl?: string;

    @Field({ nullable: true })
    isCopyright: boolean;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    episodeCurrent: string;

    @Field({ nullable: true })
    @IsOptional()
    episodeTotal: string;

    @Field({ nullable: true })
    @IsOptional()
    subDocquyen?: boolean;

    @Field({ nullable: true })
    @IsOptional()
    cinemaRelease?: boolean;

    @Field({ nullable: true })
    @IsOptional()
    year?: number;

    @Field(() => [ID], { nullable: true })
    @IsOptional()
    @IsMongoId({ each: true })
    actors?: string[];

    @Field(() => [ID], { nullable: true })
    @IsOptional()
    @IsMongoId({ each: true })
    directors?: string[];

    @Field(() => [ID], { nullable: true })
    @IsOptional()
    @IsMongoId({ each: true })
    categories?: string[];

    @Field(() => [ID], { nullable: true })
    @IsOptional()
    @IsMongoId({ each: true })
    countries?: string[];

    @Field(() => [EpisodeType], { nullable: true })
    episode?: EpisodeType[];

    @Field(() => TmdbType, { nullable: true })
    tmdb?: TmdbType;

    @Field(() => ImdbType, { nullable: true })
    imdb?: ImdbType;
}
