import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';

import { RegionsService } from './region.service';
import { UpdateRegionInput } from './inputs';
import { RegionType } from './region.type';

@Resolver(() => RegionType)
export class RegionResolver {
    constructor(private readonly regionsService: RegionsService) {}

    @Query(() => [RegionType], { name: 'regions' })
    async getRegions() {
        return this.regionsService.getRegions();
    }

    @Mutation(() => RegionType, { name: 'updateRegion' })
    async updateRegion(@Args('slug') slug: string, @Args('input') input: UpdateRegionInput) {
        return this.regionsService.updateRegion({ slug, body: { name: input?.name } });
    }
}
