import { InputType, Field, ID } from '@nestjs/graphql';
import { IsOptional, IsString, IsBoolean, IsNumber, IsArray, IsMongoId } from 'class-validator';
import { EpisodeType, ImdbType, TmdbType } from '../movie.type';

@InputType()
export class UpdateMovieInput {
    @Field(() => ID)
    @IsString()
    _id: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    name?: string;

    @Field(() => [ID], { nullable: true })
    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    actors?: string[];

    @Field(() => [ID], { nullable: true })
    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    categories?: string[];

    @Field({ nullable: true })
    @IsOptional()
    @IsBoolean()
    cinemaRelease?: boolean;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    content?: string;

    @Field(() => [ID], { nullable: true })
    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    countries?: string[];

    @Field(() => [ID], { nullable: true })
    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    directors?: string[];

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    episodeCurrent?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    episodeTotal?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsBoolean()
    isCopyright?: boolean;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    lang?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    notify?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    originName?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    posterUrl?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    quality?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    showtimes?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    slug?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    status?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsBoolean()
    subDocquyen?: boolean;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    thumbUrl?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    time?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    trailerUrl?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    type?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsNumber()
    year?: number;

    @Field(() => [EpisodeType], { nullable: true })
    @IsOptional()
    @IsArray()
    episode?: EpisodeType[];

    @Field(() => ImdbType, { nullable: true })
    @IsOptional()
    imdb?: ImdbType;

    @Field(() => TmdbType, { nullable: true })
    @IsOptional()
    tmdb?: TmdbType;

    @Field({ nullable: true })
    @IsOptional()
    deletedAt?: 'delete' | 'restore' | 'hard-delete';
}
