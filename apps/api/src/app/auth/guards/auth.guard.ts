import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { UserRoleEnum } from '../../users/users.enum';
import { RolesGuard } from './roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { JwtGqlStrategy } from '../strategies';

export function RequiredRoles(
    roleOrRoles: UserRoleEnum | UserRoleEnum[],
    options: { isGql: boolean } = { isGql: false },
) {
    const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];

    if (options?.isGql) {
        return applyDecorators(Roles(...roles), UseGuards(JwtGqlStrategy, RolesGuard));
    }

    return applyDecorators(
        ApiBearerAuth(),
        Roles(...roles),
        UseGuards(AuthGuard('jwt'), RolesGuard),
    );
}
