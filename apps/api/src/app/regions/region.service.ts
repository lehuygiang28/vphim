import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { RegionRepository } from './region.repository';
import { UpdateRegionDto } from './dtos';
import { GetRegionsInput } from './inputs';
import { Region } from './region.schema';
import { FilterQuery } from 'mongoose';
import { createRegex } from '@vn-utils/text';

@Injectable()
export class RegionsService {
    private readonly logger: Logger;

    constructor(private readonly regionsRepo: RegionRepository) {
        this.logger = new Logger(RegionsService.name);
    }

    async getRegions(query?: GetRegionsInput) {
        const { keywords } = query;
        const filters: FilterQuery<Region> = {};

        if (keywords) {
            const regex = createRegex(keywords);
            filters.$or = [{ name: regex }, { slug: regex }, { content: regex }];
        }

        const [regions, total] = await Promise.all([
            this.regionsRepo.find({ filterQuery: filters, query }),
            this.regionsRepo.count(filters),
        ]);

        return {
            data: regions,
            total,
        };
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
