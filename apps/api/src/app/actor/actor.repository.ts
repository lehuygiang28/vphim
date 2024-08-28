import { Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';

import { Actor } from './actor.schema';
import { AbstractRepository } from '../../libs/abstract/abstract.repository';

export class ActorRepository extends AbstractRepository<Actor> {
    protected readonly logger: Logger;

    constructor(
        @InjectModel(Actor.name) protected readonly regionModel: Model<Actor>,
        @InjectConnection() connection: Connection,
    ) {
        super(regionModel, connection);
        this.logger = new Logger(ActorRepository.name);
    }
}
