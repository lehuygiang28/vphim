import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AbstractDocument } from '../../libs/abstract/abstract.schema';

@Schema({ timestamps: true })
export class Comment extends AbstractDocument {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Movie', required: true })
    movie: Types.ObjectId;

    @Prop({ type: String, required: true })
    content: string;

    @Prop({ type: Number, default: 0 })
    replyCount: number;

    @Prop({ type: Types.ObjectId, ref: 'Comment', default: null })
    parentComment?: Types.ObjectId;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
    mentionedUsers?: Types.ObjectId[];

    @Prop({ type: Number, default: null, required: false })
    editedAt?: number | null;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.pre('save', function () {
    this.set({ updatedAt: new Date(), createdAt: new Date() });
});

CommentSchema.pre('updateOne', function () {
    this.set({ updatedAt: new Date() });
});

CommentSchema.pre('findOneAndUpdate', function () {
    this.set({ updatedAt: new Date() });
});
