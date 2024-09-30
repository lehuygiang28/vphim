import { InputType, PickType } from '@nestjs/graphql';
import { GetResourceInput } from 'apps/api/src/libs/inputs';

@InputType()
export class GetActorInput extends PickType(GetResourceInput, ['_id', 'slug']) {}
