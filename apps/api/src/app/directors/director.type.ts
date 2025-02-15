import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { Director } from './director.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@ObjectType('Director')
export class DirectorType implements Director {
    @ApiProperty({ example: '66ed6e981a05f01462e68bca', format: 'ObjectId' })
    @Field(() => ID)
    _id: Types.ObjectId;

    @ApiProperty()
    @Field()
    name: string;

    @ApiProperty({ example: 'Andrew Garfield' })
    @Field()
    originalName: string;

    @ApiPropertyOptional()
    @Field({ nullable: true })
    tmdbPersonId?: number;

    @ApiProperty()
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
