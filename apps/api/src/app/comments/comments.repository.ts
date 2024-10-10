import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
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
}
