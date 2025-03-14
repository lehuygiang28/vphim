import { IsEmail, IsNotEmpty } from 'class-validator';
import type { AuthLoginPasswordlessDto } from 'apps/api/src/app/auth/dtos/auth-login-pwd-less.dto';

export class LoginPwdless implements AuthLoginPasswordlessDto {
    @IsEmail(undefined, { message: 'Email is invalid' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    returnUrl: string;
}
