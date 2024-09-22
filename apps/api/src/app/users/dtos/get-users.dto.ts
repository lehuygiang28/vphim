import { ApiPropertyOptional, IntersectionType, PartialType, PickType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { PaginationRequestDto } from '../../../libs/dtos';
import { UserDto } from './user.dto';
import { UserRoleEnum } from '../users.enum';

export class GetUsersDto extends IntersectionType(
    PickType(PartialType(UserDto), ['emailVerified'] as const),
    PaginationRequestDto,
) {
    @ApiPropertyOptional({
        type: [UserRoleEnum],
        enum: UserRoleEnum,
        description: 'Filter by user roles',
        example: [UserRoleEnum.Admin, UserRoleEnum.Member],
    })
    @IsOptional()
    @IsEnum(UserRoleEnum, { each: true })
    roles?: UserRoleEnum[];
}
