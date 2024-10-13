import { Field, ObjectType } from '@nestjs/graphql';
import { RegionType } from '../region.type';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType('GetRegionsOutput')
export class GetRegionsOutput {
    @ApiProperty({ type: [RegionType], description: 'List of regions/countries' })
    @Field(() => [RegionType])
    data: RegionType[];

    @ApiProperty({ type: Number, description: 'Number of regions/countries returned' })
    @Field()
    count: number;

    @ApiProperty({ type: Number, description: 'Total number of regions/countries' })
    @Field()
    total: number;
}
