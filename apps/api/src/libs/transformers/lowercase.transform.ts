import { TransformFnParams } from 'class-transformer/types/interfaces';
import type { MaybeType } from '../types/maybe.type';

export const lowerCaseTransformer = (params: TransformFnParams): MaybeType<string> => {
    try {
        return params.value?.trim().toLowerCase();
    } catch (error) {
        return params.value;
    }
};
