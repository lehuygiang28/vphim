import { Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';

import { Movie } from './movie.schema';
import { AbstractRepository } from '../../libs/abstract/abstract.repository';

export class MovieRepository extends AbstractRepository<Movie> {
    protected readonly logger: Logger;

    constructor(
        @InjectModel(Movie.name) protected readonly movieModel: Model<Movie>,
        @InjectConnection() connection: Connection,
    ) {
        super(movieModel, connection);
        this.logger = new Logger(MovieRepository.name);
    }
}
