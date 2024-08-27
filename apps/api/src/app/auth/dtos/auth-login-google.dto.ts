import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AuthLoginGoogleDto {
    @ApiProperty()
    @IsString()
    idToken: string;
}
