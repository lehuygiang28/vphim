import { User } from '../../../users/schemas';

export type UserJwt = Pick<User, 'role' | 'email'> & {
    userId: string;
    iat: number;
    exp: number;
};
