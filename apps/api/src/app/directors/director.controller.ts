import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { DirectorService } from './director.service';
import { GetDirectorsDto } from './dtos';
import { GetDirectorsOutput } from './outputs/get-directors.output';

@ApiTags('directors')
@Controller({
    path: '/directors',
})
export class DirectorController {
    constructor(private readonly directorService: DirectorService) {}

    @ApiOperation({ summary: 'Get directors', description: 'Get list of directors' })
    @ApiOkResponse({ type: GetDirectorsOutput })
    @Throttle({ default: { limit: 10, ttl: 10000 } })
    @Get('/')
    getDirectors(@Query() query: GetDirectorsDto) {
        return this.directorService.getDirectors(query);
    }
}
