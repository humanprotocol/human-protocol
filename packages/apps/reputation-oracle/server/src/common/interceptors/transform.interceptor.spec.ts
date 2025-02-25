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
  describe('intercept', () => {
    const interceptor = new TransformInterceptor();
    let executionContextMock: ExecutionContextMock;
    let callHandlerMock: CallHandlerMock;

    beforeEach(() => {
      executionContextMock = createExecutionContextMock();
      callHandlerMock = createCallHandlerMock();
    });

    it('should transform request body', async () => {
      const originalInput = {
        some_string: faker.string.sample(),
        some_number: faker.number.float(),
        some_boolean: faker.datatype.boolean(),
        always_null: null,
        nested_object: {
          with_array: [
            {
              of_objects: faker.string.sample(),
            },
          ],
        },
      };

      const request = { body: originalInput };
      executionContextMock.__getRequest.mockReturnValueOnce(request);

      await firstValueFrom(
        interceptor.intercept(
          executionContextMock as unknown as ExecutionContext,
          callHandlerMock,
        ),
      );

      expect(request.body).toEqual({
        someString: originalInput.some_string,
        someNumber: originalInput.some_number,
        someBoolean: originalInput.some_boolean,
        alwaysNull: null,
        nestedObject: {
          withArray: [
            {
              ofObjects: originalInput.nested_object.with_array[0].of_objects,
            },
          ],
        },
      });
    });

    it('should transform request query', async () => {
      /**
       * Interceptors called before pipes, so we can get
       * only those types that Nest automatically parses
       */
      const originalInput = {
        some_string: faker.string.sample(),
        some_number: faker.number.float(),
        some_boolean: faker.datatype.boolean(),
        some_date: faker.date.anytime(),
        some_array: faker.helpers.multiple(() => faker.string.sample()),
      };

      const request = {
        query: originalInput,
      };
      executionContextMock.__getRequest.mockReturnValueOnce(request);

      await firstValueFrom(
        interceptor.intercept(
          executionContextMock as unknown as ExecutionContext,
          callHandlerMock,
        ),
      );

      expect(request.query).toEqual({
        someString: originalInput.some_string,
        someNumber: originalInput.some_number,
        someBoolean: originalInput.some_boolean,
        someDate: originalInput.some_date,
        someArray: originalInput.some_array,
      });
    });

    it('should not transform response if it is a file', async () => {
      const testFile = new StreamableFile(Buffer.from('test-contents'));

      callHandlerMock.handle.mockReturnValueOnce(of(testFile));

      const responseBody = await firstValueFrom(
        interceptor.intercept(
          executionContextMock as unknown as ExecutionContext,
          callHandlerMock,
        ),
      );

      expect(responseBody).toEqual(testFile);
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
        some_response_date: originalResponseBody.someResponseDate,
      });
    });
  });
});
