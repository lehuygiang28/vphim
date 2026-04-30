import {
    Injectable,
    OnModuleInit,
    ServiceUnavailableException,
    UnauthorizedException,
    UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PinoLogger } from 'nestjs-pino';
import ms from 'ms';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { OAuth2Client } from 'google-auth-library';
import { Octokit } from '@octokit/rest';
import * as otplib from 'otplib';

import { RedisService } from '../../libs/modules/redis';
import { getMailCapability } from '../../libs/modules/mail';
import { convertToObjectId, getGravatarUrl, isOnlySpaces } from '../../libs/utils';
import { NullableType } from '../../libs/types';
import {
    AuthLoginGithubDto,
    AuthLoginGoogleDto,
    AuthLoginPasswordlessDto,
    AuthSignupDto,
    AuthValidatePasswordlessDto,
    LoginResponseDto,
} from './dtos';
import { UserJwt } from './strategies/types';
import { User } from '../users/schemas';
import { UsersService, UserDto, UserRoleEnum } from '../../app/users';
import type { AllConfig } from '../config';

@Injectable()
export class AuthService implements OnModuleInit {
    private readonly octokit: Octokit;

    constructor(
        private readonly logger: PinoLogger,
        private readonly configService: ConfigService<AllConfig>,
        private readonly jwtService: JwtService,
        private readonly usersService: UsersService,
        private readonly redisService: RedisService,
        @InjectQueue('BULLMQ_MAIL_QUEUE') private readonly mailQueue: Queue<unknown, unknown>,
    ) {
        this.logger.setContext(AuthService.name);
        this.octokit = new Octokit({});
    }

    private ensureMailEnabled() {
        const { enabled } = getMailCapability(this.configService);
        if (enabled) {
            return;
        }

        throw new ServiceUnavailableException({
            errors: { mail: 'mail_not_configured' },
            message: 'Mail sender is not configured',
            detail: 'Mail sender is not configured',
        });
    }

    private ensureGoogleEnabled() {
        const googleId = this.configService.get('auth.googleId', { infer: true });
        const googleSecret = this.configService.get('auth.googleSecret', { infer: true });
        if (typeof googleId === 'string' && googleId.trim() && typeof googleSecret === 'string' && googleSecret.trim()) {
            return { googleId, googleSecret };
        }

        throw new ServiceUnavailableException({
            errors: { google: 'google_not_configured' },
            message: 'Google auth is not configured',
            detail: 'Google auth is not configured',
        });
    }

    async onModuleInit() {
        const adminEmail = this.configService
            .get('auth.adminEmail', { infer: true })
            ?.toLowerCase();
        if (!adminEmail) {
            return;
        }

        const adminFound = await this.usersService.findByEmail(adminEmail);
        if (!adminFound) {
            await this.createAdminUser(adminEmail);
            return;
        }

        if (adminFound.role === UserRoleEnum.Admin) {
            this.logger.info(`Admin user with email: "${adminEmail}" already exists`);
            return;
        }

        if (this.configService.get('auth.forceAdminEmail', { infer: true })) {
            adminFound.role = UserRoleEnum.Admin;
            await this.usersService.update(adminFound._id, { role: UserRoleEnum.Admin });
            this.logger.info(`Updated admin user with email: ${adminEmail}`);
            return;
        }

        this.logger.error(
            `User with email: "${adminEmail}" already exists but not admin, please check again or change ADMIN_EMAIL in environment variables`,
        );
        return;
    }

    private async createAdminUser(adminEmail: string) {
        adminEmail = adminEmail.toLowerCase();
        const adminCreate = await this.usersService.usersRepository.create({
            document: {
                email: adminEmail,
                emailVerified: true,
                fullName: 'Admin',
                avatar: {
                    url: getGravatarUrl(adminEmail),
                },
                password: '',
                role: UserRoleEnum.Admin,
            },
        });

        if (adminCreate) {
            this.logger.info(`Created admin user with email: ${adminEmail}`);
        }
    }

    async register({ email, ...dto }: AuthSignupDto): Promise<void> {
        this.ensureMailEnabled();
        email = email?.toLowerCase()?.trim();
        if (await this.usersService.findByEmail(email)) {
            throw new UnprocessableEntityException({
                errors: {
                    email: 'emailAlreadyExists',
                },
                message: 'Email already exists',
            });
        }

        const userCreated = await this.usersService.create({
            ...dto,
            email: email,
            emailVerified: false,
            fullName: dto?.fullName || 'faker.person.fullName()',
            avatar: {
                url: getGravatarUrl(email),
            },
        });

        const key = `auth:confirmEmailHash:${userCreated._id.toString()}`;
        const hash = await this.jwtService.signAsync(
            {
                confirmEmailUserId: userCreated._id,
                email: userCreated.email,
            },
            {
                secret: this.configService.getOrThrow('auth.confirmEmailSecret', {
                    infer: true,
                }),
                expiresIn: this.configService.getOrThrow('auth.confirmEmailTokenExpiresIn', {
                    infer: true,
                }),
            },
        );

        const urlInMail = new URL(dto.returnUrl);
        urlInMail.searchParams.set('hash', hash);

        const data = await Promise.all([
            this.redisService.set(
                key,
                { hash },
                ms(
                    this.configService
                        .getOrThrow('auth.confirmEmailTokenExpiresIn', {
                            infer: true,
                        })
                        .toString(),
                ),
            ),
            this.mailQueue.add(
                'sendEmailRegister',
                { email: userCreated.email, url: urlInMail.toString() },
                {
                    removeOnComplete: true,
                    removeOnFail: true,
                    keepLogs: 20,
                },
            ),
        ]);
        this.logger.debug(data);
    }

    async registerConfirm(hash: string): Promise<void> {
        this.ensureMailEnabled();
        let userId: UserDto['_id'];

        let jwtData: {
            confirmEmailUserId: UserDto['_id'];
            email: UserDto['email'];
        };
        try {
            jwtData = await this.jwtService.verifyAsync<{
                confirmEmailUserId: UserDto['_id'];
                email: UserDto['email'];
            }>(hash, {
                secret: this.configService.getOrThrow('auth.confirmEmailSecret', { infer: true }),
            });

            userId = jwtData.confirmEmailUserId;
        } catch (error) {
            this.logger.debug(error);
            throw new UnprocessableEntityException({
                errors: {
                    hash: `invalidHash`,
                },
                message: 'Your confirmation link is invalid',
            });
        }

        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new UnprocessableEntityException({
                errors: {
                    user: 'userNotFound',
                },
                message: `User with email '${jwtData?.email}' doesn't require registration`,
            });
        }

        const key = `auth:confirmEmailHash:${user._id.toString()}`;
        if (!(await this.redisService.existsUniqueKey(key))) {
            throw new UnprocessableEntityException({
                errors: {
                    hash: `invalidHash`,
                },
                message: 'Your confirmation link is invalid',
            });
        }

        if (user.emailVerified === true) {
            throw new UnprocessableEntityException({
                errors: {
                    user: 'alreadyConfirmed',
                },
                message: `User with email '${userId}' already confirmed`,
            });
        }

        await Promise.all([
            this.redisService.del(key),
            this.usersService.update(user._id, { ...user, emailVerified: true }),
        ]);
    }

    async requestLoginPwdless({ email, returnUrl }: AuthLoginPasswordlessDto): Promise<'OK'> {
        this.ensureMailEnabled();
        email = email?.toLowerCase()?.trim();
        let user = await this.usersService.findByEmail(email);

        if (!user) {
            const fullName = email.split('@')[0] || 'New User'; // Extract full name from email before @
            user = await this.usersService.create({
                email: email,
                emailVerified: false,
                fullName: fullName,
                avatar: {
                    url: getGravatarUrl(email),
                },
                password: '',
            });
            this.logger.info(`Created new user with email: ${email}`);
        }

        if (user?.block?.isBlocked) {
            throw new UnprocessableEntityException({
                errors: {
                    email: 'blocked',
                },
                message: `User with email '${email}' is blocked`,
            });
        }

        const key = `auth:requestLoginPwdlessHash:${user.email}`;
        const hash = await this.jwtService.signAsync(
            {
                userId: user._id,
                email: user.email,
            },
            {
                secret: this.configService.getOrThrow('auth.passwordlessSecret', { infer: true }),
                expiresIn: this.configService.getOrThrow('auth.passwordlessExpiresIn', {
                    infer: true,
                }),
            },
        );

        const otp = otplib.authenticator.generate(
            this.configService.getOrThrow('auth.otpSecret', { infer: true }),
        );
        const urlInMail = new URL(returnUrl);
        urlInMail.searchParams.set('hash', hash);

        const data = await Promise.all([
            this.redisService.set(
                key,
                { hash, otp, userId: user._id.toString(), email: user.email },
                ms(
                    this.configService
                        .getOrThrow('auth.confirmEmailTokenExpiresIn', {
                            infer: true,
                        })
                        .toString(),
                ),
            ),
            this.mailQueue.add(
                'sendEmailLogin',
                { email: user.email, url: urlInMail.toString(), otp },
                {
                    removeOnComplete: true,
                    removeOnFail: true,
                    keepLogs: 20,
                },
            ),
        ]);
        this.logger.debug(data);
        return 'OK';
    }

    async validateRequestLoginPwdless({
        hash: hashOrOtp,
        email,
    }: AuthValidatePasswordlessDto): Promise<LoginResponseDto> {
        this.ensureMailEnabled();
        email = email?.toLowerCase()?.trim();
        let userId: UserDto['_id'];
        let jwtData: { hash: string; userId: string };

        // Check if the input is a hash or OTP
        const isOtp = hashOrOtp.length === 6 && /^\d+$/.test(hashOrOtp);

        if (isOtp) {
            // Validate OTP
            const otpData = await this.redisService.get<
                NullableType<{
                    hash: string;
                    otp: string;
                    userId: string;
                    email: string;
                }>
            >(`auth:requestLoginPwdlessHash:${email}`);
            if (!otpData?.otp || otpData?.otp !== hashOrOtp) {
                throw new UnprocessableEntityException({
                    errors: {
                        otp: `invalidOtp`,
                    },
                    message: 'Your OTP is expired or invalid',
                });
            }

            userId = convertToObjectId(otpData.userId);
        } else {
            // Validate jwt, then get userId, jwtData
            try {
                jwtData = await this.jwtService.verifyAsync<{ hash: string; userId: string }>(
                    hashOrOtp,
                    {
                        secret: this.configService.getOrThrow('auth.passwordlessSecret', {
                            infer: true,
                        }),
                    },
                );
                userId = convertToObjectId(jwtData.userId);
            } catch (error) {
                this.logger.debug(error);
                throw new UnprocessableEntityException({
                    errors: {
                        hash: `invalidHash`,
                    },
                    message: 'Your login link is expired or invalid',
                });
            }
        }

        // Check user
        const user = await this.usersService.findByIdOrThrow(userId);

        if (user?.block?.isBlocked) {
            throw new UnprocessableEntityException({
                errors: {
                    email: 'blocked',
                },
                message: `User with email '${user.email}' is blocked`,
            });
        }

        // Get the hash/otp data saved in redis
        const key = `auth:requestLoginPwdlessHash:${user.email}`;
        const hashData = await this.redisService.get<
            NullableType<{
                hash: string;
                otp: string;
                userId: string;
            }>
        >(key);

        // Compare the hash or OTP
        // Ensure one time use only
        if ((!isOtp && hashData?.hash !== hashOrOtp) || (isOtp && hashData?.otp !== hashOrOtp)) {
            throw new UnprocessableEntityException({
                errors: {
                    [isOtp ? 'otp' : 'hash']: `invalid${isOtp ? 'Otp' : 'Hash'}`,
                },
                message: `Your login ${isOtp ? 'OTP' : 'link'} is expired or invalid`,
            });
        }

        const promise: (Promise<LoginResponseDto> | Promise<number> | Promise<User>)[] = [
            this.generateTokens(user),
            this.redisService.del(key),
        ];

        if (!user.emailVerified) {
            promise.push(this.usersService.update(user._id, { ...user, emailVerified: true }));
        }

        const [token] = await Promise.all(promise);
        return token as LoginResponseDto;
    }

    async validateLoginGoogle({ idToken }: AuthLoginGoogleDto) {
        const { googleId, googleSecret } = this.ensureGoogleEnabled();
        const googleClient = new OAuth2Client(googleId, googleSecret);
        const ticket = await googleClient.verifyIdToken({
            idToken: idToken,
            audience: [googleId],
        });
        const googleData = ticket.getPayload();

        if (!googleData) {
            throw new UnauthorizedException({
                errors: {
                    google: 'wrongIdToken',
                },
                message: 'Google login failed',
            });
        }

        let user = await this.usersService.findByEmail(googleData.email);
        if (!user) {
            const fullName = googleData?.email?.split('@')[0] || 'New User'; // Extract full name from email before @
            user = await this.usersService.create({
                email: googleData.email,
                fullName: isOnlySpaces(googleData?.name) ? fullName : googleData?.name,
                avatar: {
                    url: googleData?.picture,
                },
                emailVerified: true,
            });
        }

        if (!user.emailVerified) {
            user = await this.usersService.update(user._id, { ...user, emailVerified: true });
        }

        return this.generateTokens(user);
    }

    async validateLoginGithub({ accessToken }: AuthLoginGithubDto) {
        const data = await this.octokit.request('GET /user', {
            headers: {
                authorization: `token ${accessToken}`,
            },
        });

        if (!data) {
            throw new UnauthorizedException({
                errors: {
                    github: 'wrongAccessToken',
                },
                message: 'Github login failed',
            });
        }

        const { data: usrGithub } = data;
        let user = await this.usersService.findByEmail(usrGithub.email);
        if (!user) {
            const fullName = usrGithub.email.split('@')[0] || 'User'; // Extract full name from email before @
            user = await this.usersService.create({
                email: usrGithub.email,
                fullName: isOnlySpaces(usrGithub.name) ? fullName : usrGithub.name,
                avatar: {
                    url: usrGithub?.avatar_url,
                },
                emailVerified: true,
            });
        }

        if (!user.emailVerified) {
            user = await this.usersService.update(user._id, { ...user, emailVerified: true });
        }

        return this.generateTokens(user);
    }

    async generateTokens(user: UserDto): Promise<LoginResponseDto> {
        const [accessToken, refreshToken] = await Promise.all([
            await this.jwtService.signAsync(
                {
                    userId: user._id.toString(),
                    role: user.role,
                    email: user.email,
                } as Omit<UserJwt, 'iat' | 'exp'>,
                {
                    secret: this.configService.getOrThrow('auth.jwtSecret', { infer: true }),
                    expiresIn: this.configService.getOrThrow('auth.jwtTokenExpiresIn', {
                        infer: true,
                    }),
                },
            ),
            await this.jwtService.signAsync(
                {
                    userId: user._id.toString(),
                    role: user.role,
                    email: user.email,
                } as Omit<UserJwt, 'iat' | 'exp'>,
                {
                    secret: this.configService.getOrThrow('auth.refreshSecret', { infer: true }),
                    expiresIn: this.configService.getOrThrow('auth.refreshTokenExpiresIn', {
                        infer: true,
                    }),
                },
            ),
        ]);

        return {
            accessToken,
            refreshToken,
            ...user,
        };
    }

    async refreshToken({ email }: UserJwt): Promise<LoginResponseDto> {
        email = email?.toLowerCase().trim();
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new UnprocessableEntityException({
                errors: {
                    email: 'notFound',
                },
                message: `User with email '${email}' doesn't exist`,
            });
        }

        if (user?.block?.isBlocked) {
            throw new UnprocessableEntityException({
                errors: {
                    email: 'blocked',
                },
                message: `User with email '${email}' is blocked`,
            });
        }
        const { accessToken, refreshToken } = await this.generateTokens(user);
        return { accessToken, refreshToken, ...user };
    }
}
