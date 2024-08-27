import { Type } from 'class-transformer';
import {
    IsEmail,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';

class MailData {
    @IsString()
    @IsNotEmpty()
    hash: string;

    @IsNumber()
    tokenExpires: number;

    @IsOptional()
    @IsString()
    returnUrl?: string;
}

export class SendForgotPasswordDto {
    @IsString()
    @IsEmail()
    to: string;

    @ValidateNested()
    @Type(() => MailData)
    data: MailData;
}
