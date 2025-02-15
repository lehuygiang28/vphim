import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';

import { Region, RegionSchema } from './region.schema';
import { RegionRepository } from './region.repository';
import { RegionsService } from './region.service';
import { RegionController } from './region.controller';
// import { RegionCrawler } from './region.crawler';
import { RegionResolver } from './region.resolver';
import { RedisModule } from '../../libs/modules/redis';

@Module({
    imports: [
        ConfigModule.forRoot(),
        MongooseModule.forFeature([{ name: Region.name, schema: RegionSchema }]),
        ScheduleModule.forRoot(),
        RedisModule,
    ],
    controllers: [RegionController],
    providers: [RegionResolver, RegionRepository, RegionsService],
    exports: [RegionRepository],
})
export class RegionsModule {}
