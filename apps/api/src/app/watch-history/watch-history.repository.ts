import { Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';

import { WatchHistory } from './schemas';
import { AbstractRepository } from '../../libs/abstract/abstract.repository';

export class WatchHistoryRepository extends AbstractRepository<WatchHistory> {
    protected readonly logger: Logger;

    constructor(
        @InjectModel(WatchHistory.name) protected readonly watchHistoryModel: Model<WatchHistory>,
        @InjectConnection() connection: Connection,
    ) {
        super(watchHistoryModel, connection);
        this.logger = new Logger(WatchHistoryRepository.name);
    }

    async countDocuments(filterQuery = {}): Promise<number> {
        return this.count(filterQuery);
    }
}
