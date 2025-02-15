import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';

import { Actor } from './actor.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@ObjectType('Actor')
export class ActorType implements Actor {
    @ApiProperty({ example: '66ed6e981a05f01462e68bca', format: 'ObjectId' })
    @Field(() => ID)
    _id: Types.ObjectId;

    @ApiProperty({ example: 'Andrew Garfield' })
    @Field()
    name: string;

    @ApiProperty({ example: 'Andrew Garfield', description: 'Original name in native language' })
    @Field()
    originalName: string;

    @ApiPropertyOptional({ example: 1136406, description: 'TMDB person identifier' })
    @Field({ nullable: true })
    tmdbPersonId?: number;

    @ApiProperty({ example: 'andrew-garfield' })
    @Field()
    slug: string;

    @ApiPropertyOptional()
    @Field({ nullable: true })
    content?: string;

    @ApiPropertyOptional()
    @Field({ nullable: true })
    thumbUrl?: string;

    @ApiPropertyOptional()
    @Field({ nullable: true })
    posterUrl?: string;

    @ApiProperty()
    @Field(() => Date)
    createdAt?: Date;

    @ApiProperty()
    @Field(() => Date)
    updatedAt?: Date;
}
