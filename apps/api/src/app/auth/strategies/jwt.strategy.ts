import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

import { UserJwt } from './types/user-jwt.type';
import type { OrNeverType } from '../../../libs/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.getOrThrow('AUTH_JWT_SECRET'),
        });
    }

    // Why we don't check if the user exists in the database:
    // https://github.com/brocoders/nestjs-boilerplate/blob/main/docs/auth.md#about-jwt-strategy
    public async validate(payload: UserJwt): Promise<OrNeverType<UserJwt>> {
        if (!payload.userId) {
            throw new UnauthorizedException({
                errors: {
                    token: 'invalid',
                },
            });
        }

        return payload;
    }
}
