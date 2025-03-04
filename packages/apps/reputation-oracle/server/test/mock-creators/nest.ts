import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, throwError } from 'rxjs';

class MockClassOfExecutionContext {}

export type ExecutionContextMock = jest.Mocked<
  Pick<ExecutionContext, 'getClass' | 'getHandler' | 'switchToHttp'>
> & {
  __getRequest: jest.Mock;
};
export function createExecutionContextMock(): ExecutionContextMock {
  /**
   * Intentionally do not implement everything now,
   * so we provide only things that are actually used
   * with correct mock implementation.
   */
  const getRequest = jest.fn().mockReturnValue({
    body: {},
    query: {},
  });
  return {
    getClass: jest.fn().mockReturnValue(MockClassOfExecutionContext),
    getHandler: jest.fn().mockReturnValue({
      name: 'getHandlerMock',
    }),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest,
    }),
    __getRequest: getRequest,
  };
}

export type CallHandlerMock = jest.Mocked<CallHandler>;
export function createCallHandlerMock(): CallHandlerMock {
  return {
    handle: jest.fn().mockReturnValue(of({})),
  };
}

export function createHttpServiceResponse<T>(statusCode: number, body?: T) {
  return of({
    status: statusCode,
    data: body,
  } as AxiosResponse<T>);
}

export function createHttpServiceRequestError(error: Error) {
  return throwError(() => error);
}

export type HttpServiceMock = jest.Mocked<Pick<HttpService, 'get' | 'post'>>;
export function createHttpServiceMock(
  defaultStatusCode = 501,
): HttpServiceMock {
  return {
    get: jest
      .fn()
      .mockReturnValue(createHttpServiceResponse(defaultStatusCode)),
    post: jest
      .fn()
      .mockReturnValue(createHttpServiceResponse(defaultStatusCode)),
  };
}
