import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { UserDto } from '../../users/dtos';

export class LoginResponseDto extends IntersectionType(UserDto) {
    @ApiProperty()
    accessToken: string;

    @ApiProperty()
    refreshToken: string;
}
