import { InputType, PickType } from '@nestjs/graphql';
import { DeleteResourceInput } from 'apps/api/src/libs/inputs';

@InputType()
export class DeleteActorInput extends PickType(DeleteResourceInput, ['_id']) {}
