import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { verify } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

import { UserJwt } from '../strategies/types';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
    constructor(private configService: ConfigService) {}

    canActivate(context: ExecutionContext): boolean {
        const jwtSecret = this.configService.getOrThrow('AUTH_JWT_SECRET');

        // Handle different context types
        switch (context?.getType() || 'graphql') {
            case 'graphql': {
                const gqlReq = GqlExecutionContext.create(context).getContext().req;
                const authHeader = gqlReq?.headers?.authorization?.split(' ')[1];

                if (!authHeader) {
                    return true; // No token, but that's okay
                }

                try {
                    const userDecoded = verify(authHeader, jwtSecret) as UserJwt;
                    if (typeof userDecoded === 'string') {
                        return true; // Invalid token format, but still proceed
                    }

                    // Add validated user to request
                    gqlReq.user = userDecoded;
                    return true;
                } catch (error) {
                    return true; // Invalid token, but still proceed
                }
            }
            default: {
                const request = context.switchToHttp().getRequest();
                const authHeader = request?.headers?.authorization?.split(' ')[1];

                if (!authHeader) {
                    return true; // No token, but that's okay
                }

                try {
                    const userDecoded = verify(authHeader, jwtSecret) as UserJwt;
                    if (typeof userDecoded === 'string') {
                        return true; // Invalid token format, but still proceed
                    }

                    // Add validated user to request
                    request.user = userDecoded;
                    return true;
                } catch (error) {
                    return true; // Invalid token, but still proceed
                }
            }
        }
    }
}
