import { Module } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { CloudinaryModule } from 'apps/api/src/libs/modules/cloudinary.com';
import { RedisModule } from '../../libs/modules/redis';

@Module({
    imports: [CloudinaryModule, RedisModule],
    controllers: [ImagesController],
    providers: [ImagesService],
    exports: [ImagesService],
})
export class ImagesModule {}
