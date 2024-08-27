import { Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';

import { Region } from './region.schema';
import { AbstractRepository } from '../../libs/abstract/abstract.repository';

export class RegionsRepository extends AbstractRepository<Region> {
    protected readonly logger: Logger;

    constructor(
        @InjectModel(Region.name) protected readonly regionModel: Model<Region>,
        @InjectConnection() connection: Connection,
    ) {
        super(regionModel, connection);
        this.logger = new Logger(RegionsRepository.name);
    }
}
