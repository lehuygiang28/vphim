import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class IdParamDto {
    @ApiProperty()
    @IsMongoId()
    id: string;
}
