import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserJwt } from '../strategies/types/user-jwt.type';

export const getCurrentUserByContext = (context: ExecutionContext): UserJwt | null => {
    const gqlContext = GqlExecutionContext.create(context);
    const request = context.switchToHttp().getRequest();
    return request?.user || gqlContext.getContext()?.req?.user || null;
};

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) =>
    getCurrentUserByContext(context),
);
