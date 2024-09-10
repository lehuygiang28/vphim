import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { Director } from './director.schema';

@ObjectType('Director')
export class DirectorType implements Director {
    @Field(() => ID)
    _id: Types.ObjectId;

    @Field()
    name: string;

    @Field()
    slug: string;

    @Field({ nullable: true })
    content?: string;

    @Field({ nullable: true })
    thumbUrl?: string;

    @Field({ nullable: true })
    posterUrl?: string;

    @Field(() => Date)
    createdAt?: Date;

    @Field(() => Date)
    updatedAt?: Date;
}