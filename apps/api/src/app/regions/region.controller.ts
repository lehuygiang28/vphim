import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { RegionsService } from './region.service';

@ApiTags('regions')
@Controller({
    path: '/regions',
})
export class RegionController {
    constructor(private readonly regionsService: RegionsService) {}

    @Get('/')
    async getRegions() {
        return this.regionsService.getRegions({});
    }
}
