import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { ActorService } from './actor.service';
import { GetActorsDto } from './dtos';
import { GetActorsOutput } from './outputs/get-actors.output';

@ApiTags('actors')
@Controller({
    path: '/actors',
})
export class ActorController {
    constructor(private readonly actorService: ActorService) {}

    @ApiOperation({ summary: 'Get actors', description: 'Get list of actors' })
    @ApiOkResponse({ type: GetActorsOutput })
    @Throttle({ default: { limit: 10, ttl: 10000 } })
    @Get('/')
    async getActor(@Query() query: GetActorsDto) {
        return this.actorService.getActors(query);
    }
}
