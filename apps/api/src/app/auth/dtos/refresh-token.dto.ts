import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
    @ApiProperty({
        type: String,
        example: 'valid_refresh_token',
    })
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}
