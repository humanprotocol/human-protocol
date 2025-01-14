import { t } from 'i18next';
import { z } from 'zod';

export const addressSchemaOrEmptyString = z.string().refine(
  (value) => {
    if (value === '') {
      return true;
    }
    return /^0x[0-9a-fA-F]{40}$/.test(value);
  },
  {
    message: t('errors.invalidEscrowAddress'),
  }
);
