import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, Min } from 'class-validator';

@InputType()
export class PaginationInput {
    @Field({ nullable: true })
    @IsOptional()
    @Min(1)
    limit?: number = 10;

    @Field({ nullable: true })
    @IsOptional()
    @Min(1)
    page?: number = 1;
}
