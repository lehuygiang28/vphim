import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { DirectorService } from './director.service';
@ApiTags('directors')
@Controller({
    path: '/directors',
})
export class DirectorController {
    constructor(private readonly directorService: DirectorService) {}
}
