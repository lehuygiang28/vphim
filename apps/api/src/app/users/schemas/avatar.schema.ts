import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

export class AvatarSchema {
    @ApiProperty({
        type: String,
        example: 'https://example.com/avatar.png',
    })
    @Prop({ required: true })
    url: string;
}
