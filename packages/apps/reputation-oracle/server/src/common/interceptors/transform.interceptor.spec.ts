import { faker } from '@faker-js/faker';
import { ExecutionContext, StreamableFile } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';
import {
  CallHandlerMock,
  createCallHandlerMock,
  createExecutionContextMock,
  ExecutionContextMock,
} from '../../../test/mock-creators/nest';

describe('TransformInterceptor', () => {
  describe('transformRequestData', () => {
    it.each(['string', 42, BigInt(0), Symbol('test'), true, null, undefined])(
      'should not transform primitive [%#]',
      (value: unknown) => {
        expect(TransformInterceptor.transformRequestData(value)).toEqual(value);
      },
    );

    it('should not transform simple array', () => {
      const input = faker.helpers.multiple(() => faker.string.sample());

      const output = TransformInterceptor.transformRequestData(input);

      expect(output).toEqual(input);
    });

    it('should transform array of objects', () => {
      const input = faker.helpers.multiple(() => ({
        test_case: faker.string.sample(),
      }));
      const expectedOutput = input.map((v) => ({
        testCase: v.test_case,
      }));

      const output = TransformInterceptor.transformRequestData(input);

      expect(output).toEqual(expectedOutput);
    });

    it('should transform plain object to camelCase', () => {
      const input = {
        random_string: faker.string.sample(),
        random_number: faker.number.float(),
        random_boolean: faker.datatype.boolean(),
        always_null: null,
      };

      const output = TransformInterceptor.transformRequestData(input);

      expect(output).toEqual({
        randomString: input.random_string,
        randomNumber: input.random_number,
        randomBoolean: input.random_boolean,
        alwaysNull: null,
      });
    });

    it('should transform input with nested data', () => {
      const randomString = faker.string.sample();

      const input = {
        nested_object: {
          with_array: [
            {
              of_objects: {
                with_random_string: randomString,
              },
            },
          ],
        },
      };

      const output = TransformInterceptor.transformRequestData(input);

      expect(output).toEqual({
        nestedObject: {
          withArray: [
            {
              ofObjects: {
                withRandomString: randomString,
              },
            },
          ],
        },
      });
    });
  });

  describe('transformResponseData', () => {
    it.each(['string', 42, BigInt(0), Symbol('test'), true, null, undefined])(
      'should not transform primitive [%#]',
      (value: unknown) => {
        expect(TransformInterceptor.transformResponseData(value)).toEqual(
          value,
        );
      },
    );

    it('should not transfrom file response', () => {
      const input = new StreamableFile(Buffer.from('file-contents'));

      const output = TransformInterceptor.transformResponseData(input);

      expect(output).toEqual(input);
    });

    it('should not transform simple array', () => {
      const input = faker.helpers.multiple(() => faker.string.sample());

      const output = TransformInterceptor.transformResponseData(input);

      expect(output).toEqual(input);
    });

    it('should transform array of objects', () => {
      const input = faker.helpers.multiple(() => ({
        testCase: faker.string.sample(),
      }));
      const expectedOutput = input.map((v) => ({
        test_case: v.testCase,
      }));

      const output = TransformInterceptor.transformResponseData(input);

      expect(output).toEqual(expectedOutput);
    });

    it('should transform plain object to camelCase', () => {
      const input = {
        randomString: faker.string.sample(),
        randomNumber: faker.number.float(),
        randomBoolean: faker.datatype.boolean(),
        alwaysNull: null,
      };

      const output = TransformInterceptor.transformResponseData(input);

      expect(output).toEqual({
        random_string: input.randomString,
        random_number: input.randomNumber,
        random_boolean: input.randomBoolean,
        always_null: null,
      });
    });

    it('should transform date in response to ISO string', () => {
      const input = {
        date: faker.date.anytime(),
        nested: {
          date: faker.date.anytime(),
        },
        array: [faker.date.anytime()],
      };

      const output = TransformInterceptor.transformResponseData(input);

      expect(output).toEqual({
        date: input.date.toISOString(),
        nested: {
          date: input.nested.date.toISOString(),
        },
        array: input.array.map((v) => v.toISOString()),
      });
    });

    it('should transform input with nested data', () => {
      const randomString = faker.string.sample();

      const input = {
        nestedObject: {
          withArray: [
            {
              ofObjects: {
                withRandomString: randomString,
              },
            },
          ],
        },
      };

      const output = TransformInterceptor.transformResponseData(input);

      expect(output).toEqual({
        nested_object: {
          with_array: [
            {
              of_objects: {
                with_random_string: randomString,
              },
            },
          ],
        },
      });
    });
  });

  describe('intercept', () => {
    const interceptor = new TransformInterceptor();
    let executionContextMock: ExecutionContextMock;
    let callHandlerMock: CallHandlerMock;

    beforeEach(() => {
      executionContextMock = createExecutionContextMock();
      callHandlerMock = createCallHandlerMock();
    });

    it('should transform request', async () => {
      const randomValueForBody = faker.string.sample();
      const randomValueForQuery = faker.string.sample();

      const request = {
        body: {
          some_body_key: randomValueForBody,
        },
        query: {
          some_query_key: randomValueForQuery,
        },
      };
      executionContextMock.__getRequest.mockReturnValueOnce(request);

      await firstValueFrom(
        interceptor.intercept(
          executionContextMock as unknown as ExecutionContext,
          callHandlerMock,
        ),
      );

      expect(request.body).toEqual({
        someBodyKey: randomValueForBody,
      });

      expect(request.query).toEqual({
        someQueryKey: randomValueForQuery,
      });
    });

    it('should transform response', async () => {
      const originalResponseBody = {
        someResponseValue: faker.string.sample(),
        someResponseDate: faker.date.anytime(),
      };
      callHandlerMock.handle.mockReturnValueOnce(of(originalResponseBody));

      const interceptedResponseBody = await firstValueFrom(
        interceptor.intercept(
          executionContextMock as unknown as ExecutionContext,
          callHandlerMock,
        ),
      );

      expect(interceptedResponseBody).toEqual({
        some_response_value: originalResponseBody.someResponseValue,
        some_response_date: originalResponseBody.someResponseDate.toISOString(),
      });
    });
  });
});
