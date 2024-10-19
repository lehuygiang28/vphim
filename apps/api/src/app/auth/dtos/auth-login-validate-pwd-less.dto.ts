import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { lowerCaseTransformer } from 'apps/api/src/libs/transformers/lowercase.transform';

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
    @Transform(lowerCaseTransformer)
    email?: string;
}
