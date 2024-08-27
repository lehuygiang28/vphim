import { SetMetadata } from '@nestjs/common';
import { UserRoleEnum } from '../../users/users.enum';

export const Roles = (...roles: UserRoleEnum[]) => SetMetadata(Roles.name, roles);
