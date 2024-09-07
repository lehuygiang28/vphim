import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpdateRegionInput {
    @Field({ nullable: true })
    name?: string;
}
