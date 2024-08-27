import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class BlockUserDto {
    @ApiProperty({ type: String })
    @IsString()
    @IsNotEmpty()
    reason: string;

    @ApiPropertyOptional({ type: String })
    note?: string;
}
