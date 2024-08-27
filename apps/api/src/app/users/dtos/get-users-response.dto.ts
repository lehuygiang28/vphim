import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { PaginationResponseDto } from '../../../libs/dtos';

import { UserDto } from './user.dto';

export class GetUsersResponseDto extends IntersectionType(PaginationResponseDto<UserDto>) {
    @ApiProperty({ type: [UserDto] })
    data: UserDto[];
}
