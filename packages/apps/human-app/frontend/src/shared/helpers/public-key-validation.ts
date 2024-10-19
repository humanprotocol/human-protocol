import { t } from 'i18next';
import { z } from 'zod';

export const publicKeySchema = z
  .string()
  .length(128, { message: t('validation.publicKeyLengthError') })
  .regex(/^[0-9a-fA-F]+$/, {
    message: t('validation.publicKeyHexadecimalStringError'),
  });
