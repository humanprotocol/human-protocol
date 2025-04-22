import { type z } from 'zod';
import { type resetPasswordDtoSchema } from './schemas';

export type ResetPasswordDto = z.infer<typeof resetPasswordDtoSchema>;
