import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { RegionRepository } from './region.repository';
import { UpdateRegionDto } from './dtos';

@Injectable()
export class RegionsService {
    private readonly logger: Logger;

    constructor(private readonly regionsRepo: RegionRepository) {
        this.logger = new Logger(RegionsService.name);
    }

    async getRegions() {
        return this.regionsRepo.find({ filterQuery: {} });
    }

    async updateRegion({ slug, body }: { slug: string; body: UpdateRegionDto }) {
        if (Object.keys(body)?.length === 0) {
            throw new BadRequestException({
                errors: {
                    body: 'No data to update',
                },
                message: 'No data to update',
            });
        }

        return this.regionsRepo.findOneAndUpdateOrThrow({
            filterQuery: { slug },
            updateQuery: { name: body?.name },
        });
    }
}
