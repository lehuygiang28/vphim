import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AuthValidatePasswordlessDto {
    @ApiProperty({
        example: 'hash',
        required: true,
        type: String,
    })
    @IsNotEmpty()
    @IsString()
    hash: string;
}
