import { Field, InputType, PartialType } from '@nestjs/graphql';
import { AvatarType } from '../user.type';

@InputType()
export class AvatarMutationInput extends PartialType(AvatarType) {
    @Field({ nullable: true })
    url?: string;
}

@InputType()
export class MutationMeInput {
    @Field({ nullable: true })
    fullName?: string;

    @Field(() => AvatarMutationInput, { nullable: true })
    avatar?: AvatarMutationInput;
}
