import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { ActorService } from './actor.service';
import { GetActorsDto } from './dtos';

@ApiTags('actors')
@Controller({
    path: '/actors',
})
export class ActorController {
    constructor(private readonly actorService: ActorService) {}

    @Throttle({ default: { limit: 10, ttl: 10000 } })
    @Get('/')
    async getActor(@Query() query: GetActorsDto) {
        return this.actorService.getActors(query);
    }
}
