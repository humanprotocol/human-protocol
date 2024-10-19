import { t } from 'i18next';
import { z } from 'zod';

export const urlDomainSchema = z
  .string()
  .url()
  .refine(
    (url) => {
      try {
        const parsedUrl = new URL(url);
        const domainPattern = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return domainPattern.test(parsedUrl.hostname);
      } catch (e) {
        return false;
      }
    },
    { message: t('validation.urlDomainValidationError') }
  )
  .refine(
    (url) => {
      try {
        const parsedUrl = new URL(url);
        return parsedUrl.protocol === 'https:'; // Check if the URL starts with https
      } catch (e) {
        return false;
      }
    },
    { message: t('validation.invalidProtocol') }
  );
