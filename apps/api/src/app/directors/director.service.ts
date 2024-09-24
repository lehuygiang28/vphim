import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { DirectorRepository } from './director.repository';
import { UpdateDirectorDto } from './dtos';
import { Director } from './director.schema';
import { GetDirectorsInput } from './inputs/get-directors.input';
import { FilterQuery } from 'mongoose';
import { createRegex } from '@vn-utils/text';
import { RedisService } from '../../libs/modules/redis/services';
import { sortedStringify } from '../../libs/utils/common';

@Injectable()
export class DirectorService {
    private readonly logger: Logger;

    constructor(
        private readonly directorRepo: DirectorRepository,
        private readonly redisService: RedisService,
    ) {
        this.logger = new Logger(DirectorService.name);
    }

    async getDirector() {
        return this.directorRepo.find({ filterQuery: {} });
    }

    async getDirectors(query?: GetDirectorsInput) {
        const cacheKey = `CACHED:DIRECTORS:${sortedStringify(query)}`;

        const fromCache = await this.redisService.get(cacheKey);
        if (fromCache) {
            return fromCache;
        }

        const { keywords } = query;
        const filters: FilterQuery<Director> = {};

        if (keywords) {
            const regex = createRegex(keywords);
            filters.$or = [{ name: regex }, { slug: regex }, { content: regex }];
        }

        const [directors, total] = await Promise.all([
            this.directorRepo.find({ filterQuery: filters, query }),
            this.directorRepo.count(filters),
        ]);
        const result = { data: directors, total };

        await this.redisService.set(cacheKey, result, 1000 * 10);
        return result;
    }

    async updateDirector({ slug, body }: { slug: string; body: UpdateDirectorDto }) {
        if (Object.keys(body)?.length === 0) {
            throw new BadRequestException({
                errors: {
                    body: 'No data to update',
                },
                message: 'No data to update',
            });
        }

        return this.directorRepo.findOneAndUpdateOrThrow({
            filterQuery: { slug },
            updateQuery: { name: body?.name },
        });
    }
}
