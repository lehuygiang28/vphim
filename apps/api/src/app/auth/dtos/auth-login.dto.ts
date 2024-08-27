import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '../../../libs/transformers';

export class AuthEmailLoginDto {
    @ApiProperty({
        example: 'test@gmail.com',
        description: 'User email',
        required: true,
        type: String,
    })
    @Transform(lowerCaseTransformer)
    @IsEmail()
    @IsNotEmpty()
    destination: string;

    @ApiProperty({
        example: 'securePassW0rd',
        description: 'User password',
        required: false,
        type: String,
    })
    @IsOptional()
    @IsNotEmpty()
    password?: string;
}
