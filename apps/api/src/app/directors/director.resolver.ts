import { Args, Query, Resolver } from '@nestjs/graphql';

import { DirectorType } from './director.type';
import { DirectorService } from './director.service';
import { GetDirectorsOutput } from './outputs/get-directors.output';
import { GetDirectorsInput } from './inputs/get-directors.input';

@Resolver(() => DirectorType)
export class DirectorResolver {
    constructor(private readonly directorsService: DirectorService) {}

    @Query(() => GetDirectorsOutput, { name: 'directors' })
    async directors(@Args('input') input?: GetDirectorsInput) {
        return this.directorsService.getDirectors(input);
    }
}
