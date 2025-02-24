import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';

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
