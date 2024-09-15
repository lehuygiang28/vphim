import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HydratedDocument, Types } from 'mongoose';
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

    @Prop({ type: Types.ObjectId, default: [], ref: 'Movie' })
    followMovies?: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', function () {
    this.set({ updatedAt: new Date(), createdAt: new Date() });
});

UserSchema.pre('updateOne', function () {
    this.set({ updatedAt: new Date() });
});

UserSchema.pre('findOneAndUpdate', function () {
    this.set({ updatedAt: new Date() });
});
