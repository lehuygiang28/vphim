import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { BullModule } from '@nestjs/bullmq';

import { UsersModule } from '../../app/users';
import { RedisModule } from '../../libs/modules/redis';
import { MailModule } from '../../libs/modules/mail';

import { AuthService } from './auth.service';
import { JwtGqlStrategy, JwtRefreshStrategy, JwtStrategy } from './strategies';
import { AuthController } from './auth.controller';
import { ConfigModule } from '@nestjs/config';
import authConfig from './config/auth-config';

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [authConfig],
        }),
        JwtModule.register({}),
        BullModule.registerQueue({
            name: 'BULLMQ_MAIL_QUEUE',
        }),
        PassportModule,
        MailModule,
        RedisModule,
        UsersModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, JwtGqlStrategy, JwtRefreshStrategy],
    exports: [AuthService],
})
export class AuthModule {}
