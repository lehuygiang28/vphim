import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { ActorRepository } from './actor.repository';
import { UpdateActorDto } from './dtos';

@Injectable()
export class ActorService {
    private readonly logger: Logger;

    constructor(private readonly actorRepo: ActorRepository) {
        this.logger = new Logger(ActorService.name);
    }

    async getActor() {
        return this.actorRepo.find({ filterQuery: {} });
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
