import { Controller } from '@nestjs/common';
import { RegionsService } from './region.service';

@Controller({
    path: '/regions',
})
export class RegionController {
    constructor(private readonly regionsService: RegionsService) {}
}
