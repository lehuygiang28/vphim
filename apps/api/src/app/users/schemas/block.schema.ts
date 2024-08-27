import { Prop } from '@nestjs/mongoose';
import { UserBlockActionEnum } from '../users.enum';
import { Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export class BlockActivityLog {
    @ApiProperty({ type: String, enum: UserBlockActionEnum, example: UserBlockActionEnum.Block })
    @Prop({ required: true, type: String, enum: UserBlockActionEnum })
    action: string;

    @ApiProperty({ type: String, format: 'date-time', example: Date.now() })
    @Prop({ required: true, type: Date, default: Date.now })
    actionAt: Date;

    @ApiProperty({ type: String, format: 'ObjectId', example: '507f1f77bcf86cd799439011' })
    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    actionBy: Types.ObjectId;

    @ApiProperty({ type: String, example: 'reason to be block or unblock' })
    @Prop({ required: true, type: String })
    reason: string;

    @ApiProperty({ type: String, example: 'note' })
    @Prop({ type: String, default: '' })
    note: string;
}

export class UserBlockSchema {
    @ApiProperty({ type: Boolean, example: false })
    @Prop({ default: false })
    isBlocked: boolean;

    @ApiProperty({ type: [BlockActivityLog] })
    @Prop({ type: [BlockActivityLog], default: [] })
    activityLogs: BlockActivityLog[];
}
