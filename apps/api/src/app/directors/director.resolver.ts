import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';

import { DirectorType } from './director.type';
import { DirectorService } from './director.service';
import { GetDirectorsOutput } from './outputs/get-directors.output';
import { GetDirectorsInput } from './inputs/get-directors.input';
import { GetDirectorInput } from './inputs/get-director.input';
import { RequiredRoles } from '../auth/guards';
import { UserRoleEnum } from '../users/users.enum';
import { UpdateDirectorInput } from './inputs/update-director.input';
import { CreateDirectorInput } from './inputs/create-director.input';
import { DeleteDirectorInput } from './inputs/delete-director.input';

@Resolver(() => DirectorType)
export class DirectorResolver {
    constructor(private readonly directorsService: DirectorService) {}

    @Query(() => GetDirectorsOutput, { name: 'directors' })
    async directors(@Args('input') input?: GetDirectorsInput) {
        return this.directorsService.getDirectors(input);
    }
    @Query(() => DirectorType, { name: 'director' })
    async getDirector(@Args('input') { _id, slug }: GetDirectorInput) {
        return this.directorsService.getDirector({ _id, slug });
    }

    @RequiredRoles('admin' as UserRoleEnum, { isGql: true })
    @Mutation(() => DirectorType, { name: 'updateDirector' })
    async updateDirector(@Args('input') input: UpdateDirectorInput) {
        return this.directorsService.updateDirector(input);
    }

    @RequiredRoles('admin' as UserRoleEnum, { isGql: true })
    @Mutation(() => DirectorType, { name: 'createDirector' })
    async createDirector(@Args('input') { name, slug }: CreateDirectorInput): Promise<DirectorType> {
        return this.directorsService.createDirector({ name, slug });
    }

    @RequiredRoles('admin' as UserRoleEnum, { isGql: true })
    @Mutation(() => Int, { name: 'deleteDirector' })
    async deleteDirector(@Args('input') { _id }: DeleteDirectorInput) {
        return this.directorsService.deleteDirector({ _id });
    }
}
