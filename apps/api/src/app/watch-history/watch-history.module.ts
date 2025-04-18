import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { WatchHistory, WatchHistorySchema } from './schemas';
import { WatchHistoryRepository } from './watch-history.repository';
import { WatchHistoryService } from './watch-history.service';
import { WatchHistoryResolver } from './watch-history.resolver';
import { UsersModule } from '../users/users.module';
import { MovieModule } from '../movies';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: WatchHistory.name, schema: WatchHistorySchema }]),
        UsersModule,
        MovieModule,
    ],
    controllers: [],
    providers: [WatchHistoryRepository, WatchHistoryService, WatchHistoryResolver],
    exports: [WatchHistoryService],
})
export class WatchHistoryModule {}
