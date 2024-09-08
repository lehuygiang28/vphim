import { Field, ObjectType } from '@nestjs/graphql';
import { RegionType } from '../region.type';

@ObjectType('GetRegionsOutput')
export class GetRegionsOutput {
    @Field(() => [RegionType])
    data: RegionType[];

    @Field()
    total: number;
}
