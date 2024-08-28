import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { DirectorService } from './director.service';
import { SlugParamDto } from '../../libs/dtos';
import { UpdateDirectorDto } from './dtos';

@ApiTags('directors')
@Controller({
    path: '/directors',
})
export class DirectorController {
    constructor(private readonly directorService: DirectorService) {}

    @Get('/')
    async getDirector() {
        return this.directorService.getDirector();
    }

    @Patch('/:slug')
    async updateDirector(@Param() { slug }: SlugParamDto, @Body() body: UpdateDirectorDto) {
        return this.directorService.updateDirector({ slug, body });
    }
}
