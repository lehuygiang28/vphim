import { RegisterValidator } from '@/validators';
import { AuthRegisterConfirmDto } from 'apps/api/src/app/auth/dtos';

export type RequestRegisterAction = {
    type: 'request-register';
} & RegisterValidator;

export type RegisterAction = {
    type: 'register';
    to: null | string;
} & AuthRegisterConfirmDto;

export type RegisterActionPayload = RegisterAction | RequestRegisterAction;
