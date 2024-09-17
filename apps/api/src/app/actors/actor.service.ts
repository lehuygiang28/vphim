import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { ActorRepository } from './actor.repository';
import { UpdateActorDto } from './dtos';
import { GetActorsInput } from './inputs/get-actors.input';
import { createRegex } from '@vn-utils/text';
import { FilterQuery } from 'mongoose';
import { Actor } from './actor.schema';

@Injectable()
export class ActorService {
    private readonly logger: Logger;

    constructor(private readonly actorRepo: ActorRepository) {
        this.logger = new Logger(ActorService.name);
    }

    async getActors(query?: GetActorsInput) {
        const { keywords } = query;
        const filters: FilterQuery<Actor> = {};

        if (keywords) {
            const regex = createRegex(keywords);
            filters.$or = [{ name: regex }, { slug: regex }, { content: regex }];
        }

        const [regions, total] = await Promise.all([
            this.actorRepo.find({ filterQuery: filters, query }),
            this.actorRepo.count(filters),
        ]);

        return {
            data: regions,
            total,
        };
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
