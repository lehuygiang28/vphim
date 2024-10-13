import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { RegionsService } from './region.service';
import { GetRegionsDto } from './dtos';
import { GetRegionsOutput } from './outputs/get-regions.output';

@ApiTags('regions')
@Controller({
    path: '/regions',
})
export class RegionController {
    constructor(private readonly regionsService: RegionsService) {}

    @ApiOperation({ summary: 'Get regions/countries' })
    @ApiOkResponse({ type: GetRegionsOutput, description: 'Regions returned successfully' })
    @Throttle({ default: { limit: 10, ttl: 10000 } })
    @Get('/')
    async getRegions(@Query() query: GetRegionsDto) {
        return this.regionsService.getRegions(query);
    }
}
