import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { UserRoleEnum } from '../../users/users.enum';
import { RolesGuard } from './roles.guard';
import { Roles } from '../decorators/roles.decorator';

export function RequiredRoles(...roles: UserRoleEnum[]) {
    if (!roles?.length) {
        return applyDecorators(ApiBearerAuth(), Roles(...roles), UseGuards(AuthGuard('jwt')));
    }
    return applyDecorators(
        ApiBearerAuth(),
        (...roles: UserRoleEnum[]) => SetMetadata(Roles.name, roles),
        UseGuards(AuthGuard('jwt'), RolesGuard),
    );
}
