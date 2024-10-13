import { Field, ObjectType } from '@nestjs/graphql';
import { ActorType } from '../actor.type';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType()
export class GetActorsOutput {
    @ApiProperty({ type: [ActorType], description: 'List of actors' })
    @Field(() => [ActorType])
    data: ActorType[];

    @ApiProperty({ type: Number, description: 'Number of actors returned' })
    @Field()
    count: number;

    @ApiProperty({ type: Number, description: 'Total number of actors' })
    @Field()
    total: number;
}
