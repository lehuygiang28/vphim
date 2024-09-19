/**
 * Configuration for authentication mechanisms including JWT, refresh tokens, passwordless authentication,
 * email confirmation, password reset, and third-party authentication via Google.
 */
export type AuthConfig = {
    /** Admin email. */
    adminEmail?: string;
    /** Will force to change role of `adminEmail` to admin. */
    forceAdminEmail?: boolean;
    /** Duration before the JWT token expires. */
    jwtTokenExpiresIn: string;
    /** Secret key used to sign the JWT token. */
    jwtSecret: string;
    /** Duration before the refresh token expires. */
    refreshTokenExpiresIn: string;
    /** Secret key used to sign the refresh token. */
    refreshSecret: string;
    /** Duration before the passwordless authentication token expires. */
    passwordlessExpiresIn: string;
    /** Secret key used for passwordless authentication token. */
    passwordlessSecret: string;
    /** Duration before the email confirmation token expires. */
    confirmEmailTokenExpiresIn: string;
    /** Secret key used to sign the email confirmation token. */
    confirmEmailSecret: string;
    /** Client ID for Google authentication. */
    googleId: string;
    /** Secret key for Google authentication. */
    googleSecret: string;
    /** Secret key used to sign the OTP token. */
    otpSecret: string;
};
