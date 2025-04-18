import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

import { OptionalAuthGuard } from './optional-auth.guard';

export function OptionalAuth() {
    return applyDecorators(
        ApiHeader({
            name: 'Authorization',
            description: 'Optional JWT token',
            required: false,
        }),
        UseGuards(OptionalAuthGuard),
    );
}
