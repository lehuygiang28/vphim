import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { DirectorService } from './director.service';
import { GetDirectorsDto } from './dtos';

@ApiTags('directors')
@Controller({
    path: '/directors',
})
export class DirectorController {
    constructor(private readonly directorService: DirectorService) {}

    @Throttle({ default: { limit: 10, ttl: 10000 } })
    @Get('/')
    getDirectors(@Query() query: GetDirectorsDto) {
        return this.directorService.getDirectors(query);
    }
}
