import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SlugParamDto {
    @ApiProperty()
    @IsString()
    slug: string;
}
