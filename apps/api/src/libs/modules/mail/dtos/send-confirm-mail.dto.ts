import {
    IsEmail,
    IsString,
    IsOptional,
    IsBoolean,
    IsObject,
    ValidateNested,
} from 'class-validator';

class MailData {
    @IsString()
    hash: string;
}

export class SendConfirmMailDto {
    @IsEmail()
    to: string;

    @IsOptional()
    @IsBoolean()
    isResend?: boolean;

    @IsObject()
    @ValidateNested()
    mailData: MailData;
}
