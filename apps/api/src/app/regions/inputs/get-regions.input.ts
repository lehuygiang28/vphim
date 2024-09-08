import { InputType, PartialType } from '@nestjs/graphql';

import { PaginationInput } from 'apps/api/src/libs/inputs/pagination.input';

@InputType()
export class GetRegionsInput extends PartialType(PaginationInput) {}
