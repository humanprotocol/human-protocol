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
    { message: 'Invalid domain in the URL' }
  );
