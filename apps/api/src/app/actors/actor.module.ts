import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';

import { Actor, ActorSchema } from './actor.schema';
import { ActorRepository } from './actor.repository';
import { ActorService } from './actor.service';
import { ActorController } from './actor.controller';
import { ActorResolver } from './actor.resolver';
import { RedisModule } from '../../libs/modules/redis';

@Module({
    imports: [
        ConfigModule.forRoot(),
        MongooseModule.forFeature([{ name: Actor.name, schema: ActorSchema }]),
        ScheduleModule.forRoot(),
        RedisModule,
    ],
    controllers: [ActorController],
    providers: [ActorResolver, ActorService, ActorRepository],
    exports: [ActorRepository],
})
export class ActorModule {}
