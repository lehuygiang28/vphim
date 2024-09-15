import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from './schemas';
import { UsersRepository } from './users.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { MovieModule } from '../movies';

@Module({
    imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), MovieModule],
    controllers: [UsersController],
    providers: [UsersResolver, UsersRepository, UsersService],
    exports: [UsersService],
})
export class UsersModule {}
