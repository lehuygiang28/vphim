import { InputType, PickType } from '@nestjs/graphql';
import { UpdateResourceInput } from 'apps/api/src/libs/inputs';

@InputType()
export class UpdateDirectorInput extends PickType(UpdateResourceInput, [
    '_id',
    'name',
    'slug',
    'originalName',
    'posterUrl',
]) {}
