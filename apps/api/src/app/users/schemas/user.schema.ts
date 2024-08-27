import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';
import { Exclude, Expose } from 'class-transformer';
import { IsEmail } from 'class-validator';

import { UserRoleEnum } from '../users.enum';
import { UserBlockSchema } from './block.schema';
import { AvatarSchema } from './avatar.schema';

import { AbstractDocument } from '../../../libs/abstract/abstract.schema';
import type { NullableType } from '../../../libs/types';

export type UserDocument = HydratedDocument<User>;

@Schema({
    timestamps: true,
    collection: 'users',
})
export class User extends AbstractDocument {
    constructor(data?: NullableType<User>) {
        super();
        Object.assign(this, data);
    }

    @ApiProperty({
        type: String,
        example: 'example@example.com',
    })
    @Prop({ unique: true, required: true })
    @IsEmail()
    email: string;

    @ApiProperty({
        example: false,
    })
    @Prop({ default: false })
    emailVerified: boolean;

    @ApiHideProperty()
    @Exclude({ toPlainOnly: true })
    @Prop({ default: '' })
    password: string;

    @ApiProperty({
        example: 'John Doe',
    })
    @Prop({ type: String, required: true })
    fullName: string;

    @ApiPropertyOptional({
        type: AvatarSchema,
    })
    @Prop({ type: AvatarSchema })
    avatar?: AvatarSchema;

    @Expose({ groups: ['me', 'admin'] })
    @ApiProperty({
        example: UserRoleEnum.Customer,
        enum: UserRoleEnum,
        type: String,
    })
    @Prop({ type: String, enum: UserRoleEnum, required: true })
    role: string;

    @ApiPropertyOptional({
        type: UserBlockSchema,
    })
    @Expose({ groups: [UserRoleEnum.Admin], toPlainOnly: true })
    @Prop({ type: UserBlockSchema, default: {} })
    block?: UserBlockSchema;
}

export const UserSchema = SchemaFactory.createForClass(User);
