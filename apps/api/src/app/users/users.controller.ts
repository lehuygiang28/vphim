import {
    Controller,
    HttpStatus,
    SerializeOptions,
    HttpCode,
    Post,
    Body,
    Query,
    Get,
    Param,
    Patch,
} from '@nestjs/common';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';

import { IdParamDto } from '../../libs/dtos';
import { NullableType } from '../../libs/types';
import { RequiredRoles, CurrentUser } from '../../app/auth';

import { UsersService } from './users.service';
import {
    BlockUserDto,
    CreateUserDto,
    GetUsersDto,
    GetUsersResponseDto,
    UpdateUserDto,
    UserDto,
} from './dtos';
import { UserRoleEnum } from './users.enum';
import type { UserJwt } from '../auth';

@RequiredRoles(UserRoleEnum.Admin)
@ApiTags('users')
@Controller({
    path: '/users',
})
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @SerializeOptions({
        groups: [UserRoleEnum.Admin],
    })
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOkResponse({
        type: UserDto,
    })
    create(@Body() userData: CreateUserDto): Promise<NullableType<UserDto>> {
        return this.usersService.create(userData);
    }

    @Get('/')
    getUsers(@Query() getUsersDto: GetUsersDto): Promise<GetUsersResponseDto> {
        return this.usersService.getUsers({ query: getUsersDto });
    }

    @Get('/:id')
    getUserById(@Param() { id }: IdParamDto): Promise<UserDto> {
        return this.usersService.getUserById(id);
    }

    @Patch('/:id')
    updateUser(
        @CurrentUser() actor: UserJwt,
        @Param() { id: userId }: IdParamDto,
        @Body() data: UpdateUserDto,
    ) {
        console.log(data);
        return this.usersService.updateUser({ actor, userId, data });
    }

    @Patch('block/:id')
    blockUser(
        @CurrentUser() actor: UserJwt,
        @Param() { id: userId }: IdParamDto,
        @Body() data: BlockUserDto,
    ): Promise<NullableType<UserDto>> {
        return this.usersService.blockUser({ actor, userId, data });
    }

    @Patch('unblock/:id')
    unblockUser(
        @CurrentUser() actor: UserJwt,
        @Param() { id: userId }: IdParamDto,
    ): Promise<NullableType<UserDto>> {
        return this.usersService.unblockUser({ actor, userId });
    }
}
