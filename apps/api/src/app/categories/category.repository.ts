import { Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';

import { Category } from './category.schema';
import { AbstractRepository } from '../../libs/abstract/abstract.repository';

export class CategoryRepository extends AbstractRepository<Category> {
    protected readonly logger: Logger;

    constructor(
        @InjectModel(Category.name) protected readonly regionModel: Model<Category>,
        @InjectConnection() connection: Connection,
    ) {
        super(regionModel, connection);
        this.logger = new Logger(CategoryRepository.name);
    }
}
