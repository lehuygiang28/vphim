import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsUrl } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '../../../libs/transformers';

export class AuthLoginPasswordlessDto {
    @ApiProperty({
        example: 'test@gmail.com',
        description: 'User email',
        required: true,
        type: String,
    })
    @Transform(lowerCaseTransformer)
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        example: 'https://admin.giaang.id.vn',
        description: 'Return url to redirect',
        required: true,
        type: String,
    })
    @IsUrl({
        require_tld: process.env.NODE_ENV === 'production' ? true : false,
    })
    returnUrl: string;
}
