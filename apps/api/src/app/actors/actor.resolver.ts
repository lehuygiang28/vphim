import { Args, Query, Resolver } from '@nestjs/graphql';

import { ActorType } from './actor.type';
import { ActorService } from './actor.service';
import { GetActorsOutput } from './outputs/get-actors.output';
import { GetActorsInput } from './inputs/get-actors.input';

@Resolver(() => ActorType)
export class ActorResolver {
    constructor(private readonly actorsService: ActorService) {}

    @Query(() => GetActorsOutput, { name: 'actors' })
    async actors(@Args('input') input?: GetActorsInput) {
        return this.actorsService.getActors(input);
    }
}
