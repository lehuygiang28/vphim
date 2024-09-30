import { BadRequestException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

import { ActorRepository } from './actor.repository';
import { GetActorsInput } from './inputs/get-actors.input';
import { createRegex, removeDiacritics, removeTone } from '@vn-utils/text';
import { FilterQuery } from 'mongoose';
import { Actor } from './actor.schema';
import { convertToObjectId, sortedStringify } from '../../libs/utils/common';
import { RedisService } from '../../libs/modules/redis/services';
import { UpdateActorInput } from './inputs/update-actor.input';
import { CreateActorInput } from './inputs/create-actor.input';
import { GetActorInput } from './inputs/get-actor.input';
import { DeleteActorInput } from './inputs/delete-actor.input';

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

    async updateActor({ _id, name }: UpdateActorInput) {
        return this.actorRepo.findOneAndUpdateOrThrow({
            filterQuery: { _id: convertToObjectId(_id) },
            updateQuery: { name: name },
        });
    }

    async createActor({ name, slug }: CreateActorInput) {
        const exists = await this.actorRepo.findOne({ filterQuery: { slug } });
        if (exists) {
            throw new BadRequestException({
                errors: {
                    slug: 'alreadyExists',
                },
                message: 'Slug already exists',
            });
        }

        return this.actorRepo.create({
            document: { name, slug: removeDiacritics(removeTone(slug)) },
        });
    }

    async getActor({ _id, slug }: GetActorInput) {
        if (_id) {
            return this.actorRepo.findOneOrThrow({
                filterQuery: { _id: convertToObjectId(_id) },
            });
        }

        if (slug) {
            return this.actorRepo.findOneOrThrow({
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

    async deleteActor({ _id }: DeleteActorInput) {
        await this.actorRepo.deleteOne({ _id: convertToObjectId(_id) });
        return 1;
    }
}
