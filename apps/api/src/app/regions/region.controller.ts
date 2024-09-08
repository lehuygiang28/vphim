import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { RegionsService } from './region.service';
import { SlugParamDto } from '../../libs/dtos';
import { UpdateRegionDto } from './dtos';

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

    @Patch('/:slug')
    async patchRegion(@Param() { slug }: SlugParamDto, @Body() body: UpdateRegionDto) {
        return this.regionsService.updateRegion({ slug, body });
    }
}
