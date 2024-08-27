import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { UserJwt } from '../strategies/types/user-jwt.type';

export const getCurrentUserByContext = (context: ExecutionContext): UserJwt | null => {
    const request = context.switchToHttp().getRequest();
    return request?.user ?? null;
};

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) =>
    getCurrentUserByContext(context),
);
