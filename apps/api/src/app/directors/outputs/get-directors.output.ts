import { Field, ObjectType } from '@nestjs/graphql';
import { DirectorType } from '../director.type';

@ObjectType()
export class GetDirectorsOutput {
    @Field(() => [DirectorType])
    data: DirectorType[];

    @Field()
    total: number;
}
