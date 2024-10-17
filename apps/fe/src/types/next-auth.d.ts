import { DefaultJWT } from 'next-auth/jwt';
import type { LoginResponseDto } from 'apps/api/src/app/auth/dtos/login-response.dto';

declare module 'next-auth' {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    declare interface Session {
        user: LoginResponseDto;
    }

    interface JWT extends DefaultJWT, LoginResponseDto {}
}
