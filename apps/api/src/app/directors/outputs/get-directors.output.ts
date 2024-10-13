import { Field, ObjectType } from '@nestjs/graphql';
import { DirectorType } from '../director.type';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType()
export class GetDirectorsOutput {
    @ApiProperty({ type: [DirectorType], description: 'List of directors' })
    @Field(() => [DirectorType])
    data: DirectorType[];

    @ApiProperty({ type: Number, description: 'Number of directors returned' })
    @Field()
    count: number;

    @ApiProperty({ type: Number, description: 'Total number of directors' })
    @Field()
    total: number;
}
