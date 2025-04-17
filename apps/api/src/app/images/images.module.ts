import { Module } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { CloudinaryModule } from 'apps/api/src/libs/modules/cloudinary.com';
import { RedisModule } from '../../libs/modules/redis';
import { ActorModule } from '../actors/actor.module';
import { DirectorModule } from '../directors/director.module';
import { MovieModule } from '../movies/movie.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [CloudinaryModule, RedisModule, ActorModule, DirectorModule, MovieModule, UsersModule],
    controllers: [ImagesController],
    providers: [ImagesService],
    exports: [ImagesService],
})
export class ImagesModule {}
