import { ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Director } from '../director.schema';

export class UpdateDirectorDto extends PickType(Director, ['name']) {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name: string;
}
