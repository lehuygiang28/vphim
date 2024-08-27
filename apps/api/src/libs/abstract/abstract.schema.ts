import { Prop, Schema } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

/**
 * @description Abstract document
 *
 * `FeatureName` is a `Class.Name`
 *
 * `CollectionName` is a lowercase and plural of `FeatureName`
 */
@Schema({ timestamps: true })
export class AbstractDocument {
    @ApiProperty({ example: '5f9d5c1d5c1d5c1d5c1d5c1d', type: String, format: 'ObjectId' })
    @Prop({ type: Types.ObjectId, default: new Types.ObjectId(), required: false })
    _id: Types.ObjectId;

    @ApiProperty({ example: new Date(), type: Date, default: new Date() })
    @Prop({ type: Date, default: new Date(), required: false })
    createdAt?: Date;

    @ApiProperty({ example: new Date(), type: Date, default: new Date() })
    @Prop({ type: Date, default: new Date(), required: false })
    updatedAt?: Date;
}
