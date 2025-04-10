import { faker } from '@faker-js/faker';
import axios from 'axios';
import nock from 'nock';

import * as httpUtils from './http';
import { Readable } from 'stream';

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

  describe('downloadFile', () => {
    afterEach(() => {
      nock.cleanAll();
    });

    afterAll(() => {
      nock.restore();
    });

    it('should throw for invalid url', async () => {
      const invalidUrl = faker.internet.domainName();

      let thrownError;
      try {
        await httpUtils.downloadFile(invalidUrl);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.location).toBe(invalidUrl);
      expect(thrownError.detail).toBe('Invalid http url');
    });

    it('should throw if file not found', async () => {
      const url = faker.internet.url();

      const scope = nock(url).get('/').reply(404);

      let thrownError;
      try {
        await httpUtils.downloadFile(url);
      } catch (error) {
        thrownError = error;
      }

      scope.done();
      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.location).toBe(url);
      expect(thrownError.detail).toBe('File not found');
    });

    it('should format axios errors', async () => {
      const url = faker.internet.url();

      const ERROR_MESSAGE = faker.lorem.words();
      const scope = nock(url).get('/').replyWithError(ERROR_MESSAGE);

      let thrownError;
      try {
        await httpUtils.downloadFile(url);
      } catch (error) {
        thrownError = error;
      }

      scope.done();
      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.location).toBe(url);
      expect(thrownError.detail).toEqual({
        name: 'Error',
        message: ERROR_MESSAGE,
        stack: expect.any(String),
        cause: expect.any(Error),
      });
    });

    it('should download file as buffer', async () => {
      const content = faker.lorem.paragraph();

      const url = faker.internet.url();

      const scope = nock(url)
        .get('/')
        .reply(200, () => Readable.from(Buffer.from(content)));

      const downloadedFile = await httpUtils.downloadFile(url);

      scope.done();
      expect(downloadedFile).toBeInstanceOf(Buffer);
      expect(downloadedFile.toString()).toBe(content);
    });

    it('should download file as stream', async () => {
      const content = faker.lorem.paragraph();

      const url = faker.internet.url();

      const scope = nock(url)
        .get('/')
        .reply(200, () => Readable.from(Buffer.from(content)));

      const downloadedFileStream = await httpUtils.downloadFile(url, {
        asStream: true,
      });

      scope.done();
      expect(downloadedFileStream).toBeInstanceOf(Readable);

      const chunks = [];
      for await (const chunk of downloadedFileStream) {
        chunks.push(chunk);
      }
      const downloadedContent = Buffer.concat(chunks).toString();
      expect(downloadedContent).toEqual(content);
    });
  });
});
