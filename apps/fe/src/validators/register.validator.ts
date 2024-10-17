import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { AuthSignupDto } from 'apps/api/src/app/auth/dtos/auth-signup.dto';

export class RegisterValidator implements AuthSignupDto {
    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail(undefined, { message: 'Email is invalid' })
    email: string;

    @IsOptional()
    @IsString({ message: "Name can't be empty" })
    fullName?: string;

    returnUrl: string;
}
