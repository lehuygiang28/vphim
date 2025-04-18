import {
    HttpException,
    HttpStatus,
    Injectable,
    Logger,
    UnprocessableEntityException,
} from '@nestjs/common';
import { FilterQuery, ProjectionType, QueryOptions, Types, isValidObjectId } from 'mongoose';
import * as bcrypt from 'bcryptjs';

import type { NullableType } from '../../libs/types';
import { convertToObjectId, getGravatarUrl } from '../../libs/utils';

import {
    BlockUserDto,
    CreateUserDto,
    GetUsersDto,
    GetUsersResponseDto,
    UpdateUserDto,
    UserDto,
} from './dtos';
import { UsersRepository } from './users.repository';
import { UserBlockActionEnum, UserRoleEnum } from './users.enum';
import { User } from './schemas';
import { UserJwt } from '../auth';
import { ConfigService } from '@nestjs/config';
import { BlockActivityLog } from './schemas/block.schema';
import { MovieService } from '../movies/movie.service';
import { createRegex } from '@vn-utils/text';
import { UserResponseAdminDto } from './dtos/user-response-admin.dto';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);
    constructor(
        public readonly usersRepository: UsersRepository,
        private readonly configService: ConfigService,
        private readonly movieService: MovieService,
    ) {}

    async create(createProfileDto: CreateUserDto): Promise<User> {
        const clonedPayload = {
            ...createProfileDto,
        };

        if (clonedPayload.password) {
            const salt = await bcrypt.genSalt();
            clonedPayload.password = await bcrypt.hash(clonedPayload.password, salt);
        }

        if (clonedPayload.email) {
            const userObject = await this.usersRepository.findOne({
                filterQuery: {
                    email: clonedPayload.email,
                },
            });
            if (userObject) {
                throw new HttpException(
                    {
                        status: HttpStatus.UNPROCESSABLE_ENTITY,
                        errors: {
                            email: 'emailAlreadyExists',
                        },
                    },
                    HttpStatus.UNPROCESSABLE_ENTITY,
                );
            }
        }

        const userCreated = await this.usersRepository.create({
            document: {
                ...clonedPayload,
                role: UserRoleEnum.Member,
                password: clonedPayload?.password ?? null,
                avatar: {
                    url: clonedPayload?.avatar?.url ?? getGravatarUrl(clonedPayload.email),
                },
            },
        });
        return userCreated;
    }

    async findByEmail(email: string): Promise<NullableType<User>> {
        const user = await this.usersRepository.findOne({
            filterQuery: {
                email,
            },
        });
        return user ? new User(user) : null;
    }

    async updateUser({
        actor: _actor,
        userId: _userId,
        data: updateData,
    }: {
        actor: UserJwt;
        userId: string;
        data: UpdateUserDto;
    }) {
        const actor = await this.findByIdOrThrow(_actor.userId);
        const user = await this.findByIdOrThrow(_userId);
        let updateQuery: UpdateUserDto = {};

        if (!this.isAdmin(actor) || this.isSelf(user, actor)) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        email: 'notAllowed',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        if (updateData?.role) {
            if (updateData.role !== UserRoleEnum.Admin && this.isRootAdmin(user)) {
                throw new HttpException(
                    {
                        status: HttpStatus.UNPROCESSABLE_ENTITY,
                        errors: {
                            email: 'notAllowed',
                        },
                    },
                    HttpStatus.UNPROCESSABLE_ENTITY,
                );
            }

            updateQuery = {
                role: updateData.role,
            };
        }

        return this.usersRepository.findOneAndUpdateOrThrow({
            filterQuery: {
                _id: user._id,
            },
            updateQuery,
        });
    }

    async update(
        userId: string | Types.ObjectId,
        payload: Partial<User>,
    ): Promise<NullableType<User>> {
        delete payload?.email;

        if (payload?.password) {
            const salt = await bcrypt.genSalt();
            payload.password = await bcrypt.hash(payload.password, salt);
        }

        const user = await this.usersRepository.findOneAndUpdate({
            filterQuery: {
                _id: convertToObjectId(userId),
            },
            updateQuery: {
                ...payload,
            },
        });
        return user ? new User(user) : null;
    }

    async findById(
        id: string | Types.ObjectId,
        options?: {
            queryOptions?: Partial<QueryOptions<User>>;
            projectionType?: ProjectionType<User>;
        },
    ): Promise<NullableType<User>> {
        const user = await this.usersRepository.findOne({
            filterQuery: {
                _id: convertToObjectId(id),
            },
            ...options,
        });
        return user ? new User(user) : null;
    }

    async findByIdOrThrow(
        id: string | Types.ObjectId,
        options?: {
            queryOptions?: Partial<QueryOptions<User>>;
            projectionType?: ProjectionType<User>;
        },
    ): Promise<User> {
        const user = await this.findById(id, options);
        if (!user) {
            throw new UnprocessableEntityException({
                errors: {
                    email: 'notFound',
                },
                message: `User with email '${user.email}' is not found`,
            });
        }
        return user;
    }

    async getUsers({ query }: { query: GetUsersDto }): Promise<GetUsersResponseDto> {
        const filter: FilterQuery<UserDto> = {};

        if (query?.emailVerified) {
            filter.emailVerified = query.emailVerified == true || query.emailVerified == 'true'; // cast to boolean
        }

        if (query?.roles?.length > 0) {
            filter.role = { $in: query.roles };
        }

        if (query?.keywords) {
            if (isValidObjectId(query.keywords)) {
                filter._id = convertToObjectId(query.keywords);
            } else {
                const regex = createRegex(query.keywords);
                filter.$or = [{ email: regex }, { fullName: regex }];
            }
        }

        const [users, total] = await Promise.all([
            this.usersRepository.find({ filterQuery: filter, query }),
            this.usersRepository.count(filter),
        ]);

        return {
            total,
            data: users,
        };
    }

    async getUserById(id: string | Types.ObjectId): Promise<UserDto> {
        return this.usersRepository.findOne({
            filterQuery: {
                _id: convertToObjectId(id),
            },
        });
    }

    async getUserByIdForAdmin(id: string | Types.ObjectId): Promise<UserResponseAdminDto> {
        return this.usersRepository.findOne({
            filterQuery: {
                _id: convertToObjectId(id),
            },
            queryOptions: {
                populate: [{ path: 'followMovies', justOne: false }],
            },
        }) as unknown as Promise<UserResponseAdminDto>;
    }

    async blockUser({
        actor: _actor,
        userId,
        data,
    }: {
        actor: UserJwt;
        userId: string;
        data: BlockUserDto;
    }) {
        const actor = await this.findByIdOrThrow(_actor.userId);
        if (actor.role !== UserRoleEnum.Admin) {
            throw new HttpException(
                {
                    status: HttpStatus.UNAUTHORIZED,
                    errors: {
                        user: 'unauthorized',
                    },
                },
                HttpStatus.UNAUTHORIZED,
            );
        }

        if (actor?.block?.isBlocked) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        user: 'alreadyBlocked',
                        forceLogout: true,
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        let user = await this.findByIdOrThrow(userId);
        const canNotBlock = this.configService.get('auth.adminEmail', { infer: true });
        if (canNotBlock && user.email === canNotBlock) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        user: 'canNotBlockRootAdmin',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        if (actor._id === user._id) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        user: 'canNotBlockSelf',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        if (user?.block?.isBlocked) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        user: 'alreadyBlocked',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        const blockLog: BlockActivityLog = {
            action: UserBlockActionEnum.Block,
            actionAt: new Date(),
            actionBy: actor._id,
            note: data?.note ?? '',
            reason: data.reason,
        };

        user = {
            ...user,
            block: {
                isBlocked: true,
                activityLogs: [...(user?.block?.activityLogs ?? []), blockLog],
            },
        };

        return this.usersRepository.findOneAndUpdate({
            filterQuery: {
                _id: convertToObjectId(userId),
            },
            updateQuery: {
                ...user,
            },
        });
    }

    async unblockUser({ actor: _actor, userId }: { actor: UserJwt; userId: string }) {
        const actor = await this.findByIdOrThrow(_actor.userId);
        if (actor.role !== UserRoleEnum.Admin) {
            throw new HttpException(
                {
                    status: HttpStatus.UNAUTHORIZED,
                    errors: {
                        user: 'unauthorized',
                    },
                },
                HttpStatus.UNAUTHORIZED,
            );
        }

        if (actor?.block?.isBlocked) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        user: 'alreadyBlocked',
                        forceLogout: true,
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        let user = await this.findByIdOrThrow(userId);
        if (actor._id === user._id) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        user: 'canNotUnblockSelf',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        if (!user?.block?.isBlocked) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        user: 'alreadyUnblocked',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        const blockLog: BlockActivityLog = {
            action: UserBlockActionEnum.Unblock,
            actionAt: new Date(),
            actionBy: actor._id,
            note: '',
            reason: '',
        };

        user = {
            ...user,
            block: {
                isBlocked: false,
                activityLogs: [...(user?.block?.activityLogs ?? []), blockLog],
            },
        };

        return this.usersRepository.findOneAndUpdate({
            filterQuery: {
                _id: convertToObjectId(userId),
            },
            updateQuery: {
                ...user,
            },
        });
    }

    async followMovie({ actor: _actor, movieSlug }: { actor: UserJwt; movieSlug: string }) {
        const actor = await this.findByIdOrThrow(_actor.userId);
        const movie = await this.movieService.getMovie({ slug: movieSlug }, { populate: false });

        if (!movie) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        movie: 'notFoundMovie',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        const follows = Array.from(
            new Set(
                [
                    ...(actor?.followMovies || []).map((follow) => follow?.toString()),
                    movie?._id?.toString(),
                ].filter(Boolean),
            ),
        );

        return this.usersRepository.findOneAndUpdate({
            filterQuery: {
                _id: convertToObjectId(_actor.userId),
            },
            updateQuery: {
                followMovies: follows.map((follow) => convertToObjectId(follow)),
            },
            queryOptions: {
                populate: [
                    {
                        path: 'followMovies',
                        justOne: false,
                    },
                ],
            },
        });
    }

    async unfollowMovie({ actor: _actor, movieSlug }: { actor: UserJwt; movieSlug: string }) {
        const actor = await this.findByIdOrThrow(_actor.userId);
        const movie = await this.movieService.getMovie({ slug: movieSlug }, { populate: false });

        if (!movie) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        movie: 'notFoundMovie',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        let follows = actor?.followMovies ?? [];
        follows = follows.filter((follow) => follow.toString() !== movie?._id.toString());

        if (follows?.length >= actor?.followMovies?.length) {
            return actor;
        }

        return this.usersRepository.findOneAndUpdate({
            filterQuery: {
                _id: convertToObjectId(_actor.userId),
            },
            updateQuery: {
                followMovies: follows,
            },
            queryOptions: {
                populate: ['followMovies'],
            },
        });
    }

    private readonly isAdmin = (actor: User | UserDto) => actor.role === UserRoleEnum.Admin;

    private readonly isSelf = (actor: User | UserDto, user: User | UserDto) =>
        actor._id === user._id;

    private readonly isRootAdmin = (user: User | UserDto) =>
        user.email === this.configService.get('auth.adminEmail', { infer: true });

    /**
     * Get an accurate count of all users in the system
     */
    async countUsers(): Promise<number> {
        return this.usersRepository.countDocuments({});
    }

    /**
     * Get an accurate count of users registered within a specific date range
     */
    async countUsersByDateRange(startDate: Date, endDate: Date): Promise<number> {
        return this.usersRepository.countDocuments({
            createdAt: { $gte: startDate, $lt: endDate },
        });
    }

    async isImageInUse(url: string) {
        const user = await this.usersRepository.findOne({
            filterQuery: { 'avatar.url': url },
        });
        if (user) {
            return true;
        }

        return false;
    }
}
