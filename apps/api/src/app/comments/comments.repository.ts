import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, PipelineStage, ProjectionType, QueryOptions } from 'mongoose';
import { AbstractRepository } from '../../libs/abstract/abstract.repository';
import { Comment } from './comment.schema';

@Injectable()
export class CommentRepository extends AbstractRepository<Comment> {
    protected readonly logger = new Logger(CommentRepository.name);

    constructor(
        @InjectModel(Comment.name) commentModel: Model<Comment>,
        @InjectConnection() connection: Connection,
    ) {
        super(commentModel, connection);
    }

    async countDocuments(filterQuery = {}): Promise<number> {
        return this.count(filterQuery);
    }

    async find(
        filterQuery = {},
        options: { sort?: Record<string, number>; limit?: number; skip?: number } = {},
    ) {
        const { sort, limit, skip } = options;
        const queryOptions: Partial<QueryOptions<Comment>> = {};

        if (sort) queryOptions.sort = sort;
        if (limit) queryOptions.limit = limit;
        if (skip) queryOptions.skip = skip;

        return super.find({ filterQuery, queryOptions });
    }
}
