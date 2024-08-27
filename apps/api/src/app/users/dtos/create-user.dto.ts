import { IntersectionType, OmitType, PartialType, PickType } from '@nestjs/swagger';
import { UserDto } from './user.dto';

export class CreateUserDto extends IntersectionType(
    OmitType(UserDto, ['_id', 'block', 'createdAt', 'updatedAt', 'role', 'password']),
    PickType(PartialType(UserDto), ['password']),
) {}
