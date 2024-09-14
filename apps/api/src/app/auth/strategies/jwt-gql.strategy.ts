import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtStrategy } from './jwt.strategy';

@Injectable()
export class JwtGqlStrategy extends JwtStrategy {
    constructor(configService: ConfigService) {
        super(configService);
    }

    getRequest(context: ExecutionContext): Request {
        const ctx = GqlExecutionContext.create(context);
        return ctx.getContext().req;
    }
}
