import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MovieModule } from '../movies';
import { UsersModule } from '../users';

import { Comment, CommentSchema } from './comment.schema';
import { CommentResolver } from './comments.resolver';
import { CommentRepository } from './comments.repository';
import { CommentService } from './comments.service';
import { RedisModule } from '../../libs/modules/redis';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
        RedisModule,
        MovieModule,
        UsersModule,
    ],
    providers: [CommentResolver, CommentRepository, CommentService],
    exports: [CommentService],
})
export class CommentsModule {}
