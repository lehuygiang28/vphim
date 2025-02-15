import { InputType, PickType } from '@nestjs/graphql';
import { CreateResourceInput } from 'apps/api/src/libs/inputs';

@InputType()
export class CreateActorInput extends PickType(CreateResourceInput, [
    'name',
    'slug',
    'originalName',
]) {}
