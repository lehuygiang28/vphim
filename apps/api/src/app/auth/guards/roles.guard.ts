import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { verify } from 'jsonwebtoken';

import { UserRoleEnum } from '../../users/users.enum';
import { getCurrentUserByContext, Roles } from '../decorators';
import { UserJwt } from '../strategies/types';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const roles = this.reflector.getAllAndOverride<UserRoleEnum[]>(Roles.name, [
            context.getClass(),
            context.getHandler(),
        ]);

        switch (context?.getType() || 'graphql') {
            case 'graphql': {
                const gqlReq = GqlExecutionContext.create(context).getContext().req;
                const authHeader = gqlReq?.headers?.authorization?.split(' ')[1];
                try {
                    const userDecoded = verify(authHeader, process.env.AUTH_JWT_SECRET) as UserJwt;
                    if (typeof userDecoded === 'string') {
                        return false;
                    }
                    if (!roles?.length) {
                        return true;
                    }

                    this.addUserToRequest(userDecoded, context);
                    return roles.includes(userDecoded?.role as UserRoleEnum);
                } catch (error) {
                    throw new UnauthorizedException(error?.message);
                }
            }
            default: {
                const request = context.switchToHttp().getRequest();
                if (!roles?.length) {
                    return true;
                }
                return roles.includes(request?.user?.role);
            }
        }
    }

    protected getUserFromContext = (context: ExecutionContext): UserJwt | null => {
        return getCurrentUserByContext(context);
    };

    /**
     * Add user to request
     * @param user The user to add to request
     * @param context The execution context of the current call
     */
    protected addUserToRequest(user: UserJwt, context: ExecutionContext) {
        switch (context?.getType() || 'graphql') {
            case 'http':
                {
                    const request: Request = context.switchToHttp().getRequest();
                    request['user'] = user;
                }
                break;
            case 'rpc':
                {
                    const ctx = context.switchToRpc().getData();
                    ctx.user = user;
                }
                break;
            case 'ws':
                {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const client: any = context.switchToWs().getClient();
                    client.handshake.auth.user = user;
                }
                break;
            case 'graphql': {
                const gqlReq = GqlExecutionContext.create(context).getContext().req;
                gqlReq.user = user;
                break;
            }
            default:
                break;
        }
    }
}
