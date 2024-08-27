import { ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Region } from '../region.schema';

export class UpdateRegionDto extends PickType(Region, ['name']) {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name: string;
}
