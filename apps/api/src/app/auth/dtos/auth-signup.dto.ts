import { ApiProperty, IntersectionType, PartialType, PickType } from '@nestjs/swagger';
import { IsUrl } from 'class-validator';

import { UserDto } from '../../users/dtos';

export class AuthSignupDto extends IntersectionType(
    PickType(UserDto, ['email']),
    PickType(PartialType(UserDto), ['fullName']),
) {
    @ApiProperty()
    @IsUrl({
        require_tld: process.env.NODE_ENV === 'production' ? true : false,
    })
    returnUrl: string;
}
