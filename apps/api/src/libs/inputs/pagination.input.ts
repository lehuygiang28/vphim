import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class PaginationInput {
    @Field({ nullable: true })
    limit?: number = 10;

    @Field({ nullable: true })
    page?: number = 1;
}
