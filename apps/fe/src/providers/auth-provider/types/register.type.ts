import type { AuthRegisterConfirmDto } from 'apps/api/src/app/auth/dtos/auth-register-confirm.dto';
import { RegisterValidator } from '@/validators';

export type RequestRegisterAction = {
    type: 'request-register';
} & RegisterValidator;

export type RegisterAction = {
    type: 'register';
    to: null | string;
} & AuthRegisterConfirmDto;

export type RegisterActionPayload = RegisterAction | RequestRegisterAction;
