import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';

import { Region, RegionSchema } from './region.schema';
import { RegionRepository } from './region.repository';
import { RegionsService } from './region.service';
import { RegionController } from './region.controller';
import { RegionCrawler } from './region.crawler';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule.forRoot(),
        MongooseModule.forFeature([{ name: Region.name, schema: RegionSchema }]),
        ScheduleModule.forRoot(),
    ],
    controllers: [RegionController],
    providers: [RegionRepository, RegionsService, RegionCrawler],
    exports: [RegionRepository],
})
export class RegionsModule {}
