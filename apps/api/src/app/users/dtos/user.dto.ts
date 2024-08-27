import { Types } from 'mongoose';
import { IntersectionType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsDate,
    IsEmail,
    IsEnum,
    IsMongoId,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    IsUrl,
    ValidateNested,
} from 'class-validator';

import { User } from '../schemas';
import { AvatarSchema } from '../schemas/avatar.schema';
import { UserBlockSchema } from '../schemas/block.schema';
import { UserRoleEnum } from '../users.enum';

export class AvatarDto extends IntersectionType(AvatarSchema) implements AvatarSchema {
    @IsOptional()
    @IsUrl({ require_tld: false })
    url: string;
}

// Extend IntersectionType to get data for swagger
// Implement User to get data field for dto to validate
export class UserDto extends IntersectionType(User) implements User {
    @IsNotEmpty()
    @IsMongoId()
    _id: Types.ObjectId;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsString()
    password: string;

    @IsNotEmpty()
    @IsString()
    fullName: string;

    @IsString()
    @IsEnum(UserRoleEnum)
    role: string;

    @IsObject()
    @ValidateNested()
    @Type(() => AvatarDto)
    avatar?: AvatarDto;

    @IsObject()
    @ValidateNested()
    @Type(() => UserBlockSchema)
    block?: UserBlockSchema;

    @IsOptional()
    @IsDate()
    createdAt?: Date;

    @IsOptional()
    @IsDate()
    updatedAt?: Date;
}
