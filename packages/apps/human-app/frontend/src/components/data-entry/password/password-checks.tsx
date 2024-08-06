import { t } from 'i18next';
import { z } from 'zod';
import type { PasswordCheck } from '@/components/data-entry/password/password-check-label';
import {
  password8Chars,
  passwordLowercase,
  passwordNumeric,
  passwordSpecialCharacter,
  passwordUppercase,
} from '@/shared/helpers/regex';

export const passwordChecks: PasswordCheck[] = [
  {
    requirementsLabel: t('validation.password8Chars'),
    schema: z.string().regex(password8Chars),
  },
  {
    requirementsLabel: t('validation.passwordUppercase'),
    schema: z.string().regex(passwordUppercase),
  },
  {
    requirementsLabel: t('validation.passwordLowercase'),
    schema: z.string().regex(passwordLowercase),
  },
  {
    requirementsLabel: t('validation.passwordNumeric'),
    schema: z.string().regex(passwordNumeric),
  },
  {
    requirementsLabel: t('validation.passwordSpecialCharacter'),
    schema: z.string().regex(passwordSpecialCharacter),
  },
];
