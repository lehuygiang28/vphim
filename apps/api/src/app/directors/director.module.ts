import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';

import { Director, DirectorSchema } from './director.schema';
import { DirectorRepository } from './director.repository';
import { DirectorService } from './director.service';
import { DirectorController } from './director.controller';
import { DirectorResolver } from './director.resolver';

@Module({
    imports: [
        ConfigModule.forRoot(),
        MongooseModule.forFeature([{ name: Director.name, schema: DirectorSchema }]),
        ScheduleModule.forRoot(),
    ],
    controllers: [DirectorController],
    providers: [DirectorResolver, DirectorService, DirectorRepository],
    exports: [DirectorRepository],
})
export class DirectorModule {}
