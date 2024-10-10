import { BadRequestException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

import { RegionRepository } from './region.repository';
import { GetRegionsInput } from './inputs';
import { Region } from './region.schema';
import { FilterQuery } from 'mongoose';
import { createRegex, removeDiacritics, removeTone } from '@vn-utils/text';
import { RedisService } from '../../libs/modules/redis/services';
import { convertToObjectId, sortedStringify } from '../../libs/utils/common';
import { CreateRegionInput } from './inputs/create-region.input';
import { GetRegionInput } from './inputs/get-region.input';
import { DeleteRegionInput } from './inputs/delete-region.input';
import { UpdateRegionInput } from './inputs/update-region.input';

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

        const { keywords = null } = query;
        const filters: FilterQuery<Region> = {};

        if (keywords) {
            const regex = createRegex(keywords);
            filters.$or = [{ name: regex }, { slug: regex }, { content: regex }];
        }

        const [regions, total] = await Promise.all([
            this.regionsRepo.find({ filterQuery: filters, query }),
            this.regionsRepo.count(filters),
        ]);
        const result = { data: regions, total, count: regions?.length || 0 };

        await this.redisService.set(cacheKey, result, 1000 * 10);
        return result;
    }

    async updateRegion({ _id, name }: UpdateRegionInput) {
        return this.regionsRepo.findOneAndUpdateOrThrow({
            filterQuery: { _id: convertToObjectId(_id) },
            updateQuery: { name: name },
        });
    }

    async createRegion({ name, slug }: CreateRegionInput) {
        const exists = await this.regionsRepo.findOne({ filterQuery: { slug } });
        if (exists) {
            throw new BadRequestException({
                errors: {
                    slug: 'alreadyExists',
                },
                message: 'Slug already exists',
            });
        }

        return this.regionsRepo.create({
            document: { name, slug: removeDiacritics(removeTone(slug)) },
        });
    }

    async getRegion({ _id, slug }: GetRegionInput) {
        if (_id) {
            return this.regionsRepo.findOneOrThrow({
                filterQuery: { _id: convertToObjectId(_id) },
            });
        }

        if (slug) {
            return this.regionsRepo.findOneOrThrow({
                filterQuery: { slug },
            });
        }

        throw new HttpException(
            {
                status: HttpStatus.UNPROCESSABLE_ENTITY,
                errors: {
                    _id: 'required',
                },
            },
            HttpStatus.UNPROCESSABLE_ENTITY,
        );
    }

    async deleteRegion({ _id }: DeleteRegionInput) {
        await this.regionsRepo.deleteOne({ _id: convertToObjectId(_id) });
        return 1;
    }
}
