import { InputType, PickType } from '@nestjs/graphql';
import { DeleteResourceInput } from 'apps/api/src/libs/inputs';

@InputType()
export class DeleteDirectorInput extends PickType(DeleteResourceInput, ['_id']) {}
