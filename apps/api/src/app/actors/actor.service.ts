import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { ActorRepository } from './actor.repository';
import { UpdateActorDto } from './dtos';
import { GetActorsInput } from './inputs/get-actors.input';
import { createRegex } from '@vn-utils/text';
import { FilterQuery } from 'mongoose';
import { Actor } from './actor.schema';
import { sortedStringify } from '../../libs/utils/common';
import { RedisService } from '../../libs/modules/redis/services';

@Injectable()
export class ActorService {
    private readonly logger: Logger;

    constructor(
        private readonly actorRepo: ActorRepository,
        private readonly redisService: RedisService,
    ) {
        this.logger = new Logger(ActorService.name);
    }

    async getActors(query?: GetActorsInput) {
        const cacheKey = `CACHED:ACTORS:${sortedStringify(query)}`;

        const fromCache = await this.redisService.get(cacheKey);
        if (fromCache) {
            return fromCache;
        }

        const { keywords } = query;
        const filters: FilterQuery<Actor> = {};

        if (keywords) {
            const regex = createRegex(keywords);
            filters.$or = [{ name: regex }, { slug: regex }, { content: regex }];
        }

        const [actors, total] = await Promise.all([
            this.actorRepo.find({ filterQuery: filters, query }),
            this.actorRepo.count(filters),
        ]);
        const result = { data: actors, total };

        await this.redisService.set(cacheKey, result, 1000 * 10);
        return result;
    }

    async updateActor({ slug, body }: { slug: string; body: UpdateActorDto }) {
        if (Object.keys(body)?.length === 0) {
            throw new BadRequestException({
                errors: {
                    body: 'No data to update',
                },
                message: 'No data to update',
            });
        }

        return this.actorRepo.findOneAndUpdateOrThrow({
            filterQuery: { slug },
            updateQuery: { name: body?.name },
        });
    }
}
