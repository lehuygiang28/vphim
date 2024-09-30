import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';

import { ActorType } from './actor.type';
import { ActorService } from './actor.service';
import { GetActorsOutput } from './outputs/get-actors.output';
import { GetActorsInput } from './inputs/get-actors.input';
import { RequiredRoles } from '../auth/guards';
import { UserRoleEnum } from '../users/users.enum';
import { GetActorInput } from './inputs/get-actor.input';
import { UpdateActorInput } from './inputs/update-actor.input';
import { CreateActorInput } from './inputs/create-actor.input';
import { DeleteActorInput } from './inputs/delete-actor.input';

@Resolver(() => ActorType)
export class ActorResolver {
    constructor(private readonly actorsService: ActorService) {}

    @Query(() => GetActorsOutput, { name: 'actors' })
    async actors(@Args('input') input?: GetActorsInput) {
        return this.actorsService.getActors(input);
    }

    @Query(() => ActorType, { name: 'actor' })
    async getActor(@Args('input') { _id, slug }: GetActorInput) {
        return this.actorsService.getActor({ _id, slug });
    }

    @RequiredRoles('admin' as UserRoleEnum, { isGql: true })
    @Mutation(() => ActorType, { name: 'updateActor' })
    async updateActor(@Args('input') input: UpdateActorInput) {
        return this.actorsService.updateActor(input);
    }

    @RequiredRoles('admin' as UserRoleEnum, { isGql: true })
    @Mutation(() => ActorType, { name: 'createActor' })
    async createActor(@Args('input') { name, slug }: CreateActorInput): Promise<ActorType> {
        return this.actorsService.createActor({ name, slug });
    }

    @RequiredRoles('admin' as UserRoleEnum, { isGql: true })
    @Mutation(() => Int, { name: 'deleteActor' })
    async deleteActor(@Args('input') { _id }: DeleteActorInput) {
        return this.actorsService.deleteActor({ _id });
    }
}
