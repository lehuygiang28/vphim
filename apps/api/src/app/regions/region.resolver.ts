import { Resolver, Query, Args, Mutation, Int } from '@nestjs/graphql';

import { RegionsService } from './region.service';
import { RegionType } from './region.type';
import { GetRegionsInput } from './inputs';
import { GetRegionsOutput } from './outputs';
import { RequiredRoles } from '../auth/guards';
import { UserRoleEnum } from '../users';
import { CreateRegionInput } from './inputs/create-region.input';
import { DeleteRegionInput } from './inputs/delete-region.input';
import { UpdateRegionInput } from './inputs/update-region.input';
import { GetRegionInput } from './inputs/get-region.input';

@Resolver(() => RegionType)
export class RegionResolver {
    constructor(private readonly regionsService: RegionsService) {}

    @Query(() => GetRegionsOutput, { name: 'regions' })
    async getRegions(@Args('input') input: GetRegionsInput) {
        return this.regionsService.getRegions(input);
    }

    @Query(() => RegionType, { name: 'region' })
    async getRegion(@Args('input') { _id, slug }: GetRegionInput) {
        return this.regionsService.getRegion({ _id, slug });
    }

    @RequiredRoles('admin' as UserRoleEnum, { isGql: true })
    @Mutation(() => RegionType, { name: 'updateRegion' })
    async updateRegion(@Args('input') input: UpdateRegionInput) {
        return this.regionsService.updateRegion(input);
    }

    @RequiredRoles('admin' as UserRoleEnum, { isGql: true })
    @Mutation(() => RegionType, { name: 'createRegion' })
    async createRegion(@Args('input') { name, slug }: CreateRegionInput): Promise<RegionType> {
        return this.regionsService.createRegion({ name, slug });
    }

    @RequiredRoles('admin' as UserRoleEnum, { isGql: true })
    @Mutation(() => Int, { name: 'deleteRegion' })
    async deleteRegion(@Args('input') { _id }: DeleteRegionInput) {
        return this.regionsService.deleteRegion({ _id });
    }
}
