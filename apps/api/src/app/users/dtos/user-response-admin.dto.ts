import { IntersectionType } from '@nestjs/swagger';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { UserDto } from './user.dto';

import { MovieType } from '../../movies/movie.type';

export class UserResponseAdminDto extends IntersectionType(UserDto) {
    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => MovieType)
    followMovies?: MovieType[];
}
