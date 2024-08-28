import { Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';

import { Director } from './director.schema';
import { AbstractRepository } from '../../libs/abstract/abstract.repository';

export class DirectorRepository extends AbstractRepository<Director> {
    protected readonly logger: Logger;

    constructor(
        @InjectModel(Director.name) protected readonly regionModel: Model<Director>,
        @InjectConnection() connection: Connection,
    ) {
        super(regionModel, connection);
        this.logger = new Logger(DirectorRepository.name);
    }
}
