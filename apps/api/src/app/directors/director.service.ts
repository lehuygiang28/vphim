import { BadRequestException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

import { DirectorRepository } from './director.repository';
import { Director } from './director.schema';
import { GetDirectorsInput } from './inputs/get-directors.input';
import { FilterQuery } from 'mongoose';
import { createRegex, removeDiacritics, removeTone } from '@vn-utils/text';
import { RedisService } from '../../libs/modules/redis/services';
import { convertToObjectId, sortedStringify } from '../../libs/utils/common';
import { UpdateDirectorInput } from './inputs/update-director.input';
import { CreateDirectorInput } from './inputs/create-director.input';
import { GetDirectorInput } from './inputs/get-director.input';
import { DeleteDirectorInput } from './inputs/delete-director.input';

@Injectable()
export class DirectorService {
    private readonly logger: Logger;

    constructor(
        private readonly directorRepo: DirectorRepository,
        private readonly redisService: RedisService,
    ) {
        this.logger = new Logger(DirectorService.name);
    }

    async getDirectors(query?: GetDirectorsInput) {
        const cacheKey = `CACHED:DIRECTORS:${sortedStringify(query)}`;

        const fromCache = await this.redisService.get(cacheKey);
        if (fromCache) {
            return fromCache;
        }

        const { keywords = null } = query;
        const filters: FilterQuery<Director> = {};

        if (keywords) {
            const regex = createRegex(keywords);
            filters.$or = [{ name: regex }, { slug: regex }, { content: regex }];
        }

        const [directors, total] = await Promise.all([
            this.directorRepo.find({ filterQuery: filters, query }),
            this.directorRepo.count(filters),
        ]);
        const result = { data: directors, total, count: directors?.length || 0 };

        await this.redisService.set(cacheKey, result, 1000 * 10);
        return result;
    }

    async updateDirector({ _id, name }: UpdateDirectorInput) {
        return this.directorRepo.findOneAndUpdateOrThrow({
            filterQuery: { _id: convertToObjectId(_id) },
            updateQuery: { name: name },
        });
    }

    async createDirector({ name, slug }: CreateDirectorInput) {
        const exists = await this.directorRepo.findOne({ filterQuery: { slug } });
        if (exists) {
            throw new BadRequestException({
                errors: {
                    slug: 'alreadyExists',
                },
                message: 'Slug already exists',
            });
        }

        return this.directorRepo.create({
            document: { name, slug: removeDiacritics(removeTone(slug)) },
        });
    }

    async getDirector({ _id, slug }: GetDirectorInput) {
        if (_id) {
            return this.directorRepo.findOneOrThrow({
                filterQuery: { _id: convertToObjectId(_id) },
            });
        }

        if (slug) {
            return this.directorRepo.findOneOrThrow({
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

    async deleteDirector({ _id }: DeleteDirectorInput) {
        await this.directorRepo.deleteOne({ _id: convertToObjectId(_id) });
        return 1;
    }
}
