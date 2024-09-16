import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ThrottlerCustomGuard extends ThrottlerGuard {
    protected getRequestResponse(context: ExecutionContext) {
        switch (context?.getType() || 'graphql') {
            case 'graphql': {
                const gqlContext = GqlExecutionContext.create(context)?.getContext();
                return {
                    req: gqlContext.req,
                    res: gqlContext.req.res,
                };
            }
            default: {
                const ctx = context?.switchToHttp();
                return {
                    req: ctx?.getRequest(),
                    res: ctx?.getResponse(),
                };
            }
        }
    }
}
