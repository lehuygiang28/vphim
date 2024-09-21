import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class GetMoviesInput {
    @Field({ nullable: true })
    name?: string;

    @Field({ nullable: true })
    categories?: string;

    @Field({ nullable: true })
    countries?: string;

    @Field(() => Boolean, { nullable: true })
    cinemaRelease?: boolean;

    @Field(() => Boolean, { nullable: true })
    isCopyright?: boolean;

    @Field({ nullable: true })
    keywords?: string;

    @Field({ nullable: true })
    limit?: number = 10;

    @Field({ nullable: true })
    page?: number = 1;

    @Field({ nullable: true })
    slug?: string;

    @Field({ nullable: true })
    sortBy?: string;

    @Field({ nullable: true })
    sortOrder?: 'asc' | 'desc';

    @Field({ nullable: true })
    type?: string;

    @Field({ nullable: true })
    years: string;

    @Field({ nullable: true })
    resetCache?: boolean;

    @Field({ nullable: true })
    status?: string;

    @Field({ nullable: true })
    isDeleted?: boolean;

    @Field({ nullable: true })
    bypassCache?: boolean;
}
