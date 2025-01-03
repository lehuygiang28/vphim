import { InputType, Field } from '@nestjs/graphql';
import { MaxLength } from 'class-validator';
import { KEYWORDS_MAX_LENGTH } from '../movie.constant';

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
    @MaxLength(KEYWORDS_MAX_LENGTH)
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
    status?: string;

    @Field(() => Boolean, { nullable: true })
    useAI?: boolean;
}
