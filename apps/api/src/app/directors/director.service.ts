import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { DirectorRepository } from './director.repository';
import { UpdateDirectorDto } from './dtos';

@Injectable()
export class DirectorService {
    private readonly logger: Logger;

    constructor(private readonly directorRepo: DirectorRepository) {
        this.logger = new Logger(DirectorService.name);
    }

    async getDirector() {
        return this.directorRepo.find({ filterQuery: {} });
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
