import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';

import { Category, CategorySchema } from './category.schema';
import { CategoryRepository } from './category.repository';
// import { CategoryCrawler } from './category.crawler';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { CategoryResolver } from './category.resolver';
import { RedisModule } from '../../libs/modules/redis';

@Module({
    imports: [
        ConfigModule.forRoot(),
        MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }]),
        ScheduleModule.forRoot(),
        RedisModule,
    ],
    controllers: [CategoryController],
    providers: [CategoryResolver, CategoryService, CategoryRepository],
    exports: [CategoryRepository],
})
export class CategoryModule {}
