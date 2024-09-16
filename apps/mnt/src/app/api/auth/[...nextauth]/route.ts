import NextAuth from 'next-auth/next';
import { authOptions } from '~fe/app/api/auth/[...nextauth]/options';

const auth = NextAuth(authOptions);
export { auth as GET, auth as POST };
