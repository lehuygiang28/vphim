import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ActorService } from './actor.service';

@ApiTags('actors')
@Controller({
    path: '/actors',
})
export class ActorController {
    constructor(private readonly actorService: ActorService) {}

    @Get('/')
    async getActor() {
        return this.actorService.getActors();
    }
}
