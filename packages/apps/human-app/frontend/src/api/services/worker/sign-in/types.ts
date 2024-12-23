import { type z } from 'zod';
import {
  type signInDtoSchema,
  type signInSuccessResponseSchema,
} from './schema';

export type SignInDto = z.infer<typeof signInDtoSchema>;

export type SignInSuccessResponse = z.infer<typeof signInSuccessResponseSchema>;
