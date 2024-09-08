import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';

import { RegionsService } from './region.service';
import { RegionType } from './region.type';
import { GetRegionsInput, UpdateRegionInput } from './inputs';
import { GetRegionsOutput } from './outputs';

@Resolver(() => RegionType)
export class RegionResolver {
    constructor(private readonly regionsService: RegionsService) {}

    @Query(() => GetRegionsOutput, { name: 'regions' })
    async getRegions(@Args('input') input: GetRegionsInput) {
        return this.regionsService.getRegions(input);
    }

    @Mutation(() => RegionType, { name: 'updateRegion' })
    async updateRegion(@Args('slug') slug: string, @Args('input') input: UpdateRegionInput) {
        return this.regionsService.updateRegion({ slug, body: { name: input?.name } });
    }
}
