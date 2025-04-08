import { Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';

import { User } from './schemas';
import { AbstractRepository } from '../../libs/abstract/abstract.repository';

export class UsersRepository extends AbstractRepository<User> {
    protected readonly logger: Logger;

    constructor(
        @InjectModel(User.name) protected readonly userModel: Model<User>,
        @InjectConnection() connection: Connection,
    ) {
        super(userModel, connection);
        this.logger = new Logger(UsersRepository.name);
    }

    async countDocuments(filterQuery = {}): Promise<number> {
        return this.count(filterQuery);
    }
}
