import { Field, ObjectType } from '@nestjs/graphql';
import { ActorType } from '../actor.type';

@ObjectType()
export class GetActorsOutput {
    @Field(() => [ActorType])
    data: ActorType[];

    @Field()
    total: number;
}
