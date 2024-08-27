import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AuthRegisterConfirmDto {
    @ApiProperty({
        example: 'hash',
        required: true,
        type: String,
    })
    @IsNotEmpty()
    hash: string;
}
