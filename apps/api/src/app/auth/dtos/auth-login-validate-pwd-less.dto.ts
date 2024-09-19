import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AuthValidatePasswordlessDto {
    @ApiProperty({
        example: 'hash',
        required: true,
        type: String,
    })
    @IsNotEmpty()
    @IsString()
    hash: string;

    @ApiPropertyOptional({
        example: 'email',
        required: false,
        type: String,
    })
    @IsOptional()
    @IsString()
    @IsEmail()
    email?: string;
}
