import { ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Actor } from '../actor.schema';

export class UpdateActorDto extends PickType(Actor, ['name']) {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name: string;
}
