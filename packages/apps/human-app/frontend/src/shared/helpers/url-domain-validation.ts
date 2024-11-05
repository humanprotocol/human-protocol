import { t } from 'i18next';
import { z } from 'zod';

export const urlDomainSchema = z.string().refine(
  (url) => {
    try {
      const newUrl = new URL(url);
      return newUrl.protocol === 'http:' || newUrl.protocol === 'https:';
    } catch (e) {
      return false;
    }
  },
  { message: t('validation.urlValidationError') }
);
