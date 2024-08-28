import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ActorService } from './actor.service';
import { SlugParamDto } from '../../libs/dtos';
import { UpdateActorDto } from './dtos';

@ApiTags('actors')
@Controller({
    path: '/actors',
})
export class ActorController {
    constructor(private readonly actorService: ActorService) {}

    @Get('/')
    async getActor() {
        return this.actorService.getActor();
    }

    @Patch('/:slug')
    async updateActor(@Param() { slug }: SlugParamDto, @Body() body: UpdateActorDto) {
        return this.actorService.updateActor({ slug, body });
    }
}
