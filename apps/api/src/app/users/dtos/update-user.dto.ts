import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { UserRoleEnum } from '../users.enum';

export class UpdateUserDto {
    @ApiPropertyOptional({
        example: UserRoleEnum.Member,
        enum: UserRoleEnum,
        type: String,
    })
    @IsOptional()
    @IsEnum(UserRoleEnum)
    role?: string;
}
