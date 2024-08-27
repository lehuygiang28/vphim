import { Injectable, Logger } from '@nestjs/common';
import { RegionsRepository } from './region.repository';

@Injectable()
export class RegionsService {
    private readonly logger: Logger;

    constructor(private readonly regionsRepo: RegionsRepository) {
        this.logger = new Logger(RegionsService.name);
    }
}
