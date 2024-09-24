import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { RegionRepository } from './region.repository';
import { UpdateRegionDto } from './dtos';
import { GetRegionsInput } from './inputs';
import { Region } from './region.schema';
import { FilterQuery } from 'mongoose';
import { createRegex } from '@vn-utils/text';
import { RedisService } from '../../libs/modules/redis/services';
import { sortedStringify } from '../../libs/utils/common';

@Injectable()
export class RegionsService {
    private readonly logger: Logger;

    constructor(
        private readonly regionsRepo: RegionRepository,
        private readonly redisService: RedisService,
    ) {
        this.logger = new Logger(RegionsService.name);
    }

    async getRegions(query?: GetRegionsInput) {
        const cacheKey = `CACHED:REGIONS:${sortedStringify(query)}`;

        const fromCache = await this.redisService.get(cacheKey);
        if (fromCache) {
            return fromCache;
        }

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
        const result = { data: regions, total };

        await this.redisService.set(cacheKey, result, 1000 * 10);
        return result;
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
