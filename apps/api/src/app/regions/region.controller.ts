import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { RegionsService } from './region.service';
import { GetRegionsDto } from './dtos';

@ApiTags('regions')
@Controller({
    path: '/regions',
})
export class RegionController {
    constructor(private readonly regionsService: RegionsService) {}

    @Throttle({ default: { limit: 10, ttl: 10000 } })
    @Get('/')
    async getRegions(@Query() query: GetRegionsDto) {
        return this.regionsService.getRegions(query);
    }
}
