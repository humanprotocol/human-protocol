import { faker } from '@faker-js/faker';
import axios from 'axios';

import * as httpUtils from './http';

describe('HTTP utilities', () => {
  describe('formatAxiosError', () => {
    it('should properly format AxiosError instance', async () => {
      const abortController = new AbortController();
      abortController.abort();

      let thrownError;
      try {
        await axios.get(faker.internet.url(), {
          signal: abortController.signal,
        });
      } catch (error) {
        thrownError = error;
      }

      const EXPECTED_CAUSE = 'synthetic';
      thrownError.cause = EXPECTED_CAUSE;

      const formattedError = httpUtils.formatAxiosError(thrownError);
      const ERROR_NAME = 'CanceledError';
      const EXPECTED_MESSAGE = 'canceled';

      expect(formattedError).toEqual({
        name: ERROR_NAME,
        message: EXPECTED_MESSAGE,
        stack: expect.stringMatching(`${ERROR_NAME}: ${EXPECTED_MESSAGE}`),
        cause: EXPECTED_CAUSE,
      });
    });
  });

  describe('isValidHttpUrl', () => {
    it.each([
      '',
      faker.string.alphanumeric(),
      faker.internet.domainName(),
      faker.internet.protocol(),
      faker.internet.ipv4(),
      // invalid port
      `${faker.internet.url({ appendSlash: false })}:${faker.lorem.word({ length: 4 })}`,
      `http://[${faker.internet.domainName()}]/`,
      'https://white space.test/',
      `ftp://${faker.internet.domainName()}`,
    ])('should return false for invalid http url [%#]', (url) => {
      expect(httpUtils.isValidHttpUrl(url)).toBe(false);
    });

    it.each([
      faker.internet.url({ protocol: 'http' }),
      faker.internet.url({ protocol: 'https' }),
      `http://${faker.internet.ipv4()}`,
      `${faker.internet.url({ protocol: 'http' })}:${faker.internet.port()}`,
    ])('should return true for valid http url [%#]', (url) => {
      expect(httpUtils.isValidHttpUrl(url)).toBe(true);
    });
  });
});
