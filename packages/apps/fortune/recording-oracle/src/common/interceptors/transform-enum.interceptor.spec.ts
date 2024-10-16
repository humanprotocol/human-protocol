import { TransformEnumInterceptor } from './transform-enum.interceptor';
import {
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { of } from 'rxjs';
import { IsNumber, IsString, Min } from 'class-validator';
import { JobRequestType } from '../../common/enums/job';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnumCaseInsensitive } from '../decorators';

export class MockDto {
  @ApiProperty({
    enum: JobRequestType,
  })
  @IsEnumCaseInsensitive(JobRequestType)
  public jobType: JobRequestType;

  @ApiProperty()
  @IsNumber()
  @Min(0.5)
  public amount: number;

  @ApiProperty()
  @IsString()
  public address: string;
}

describe('TransformEnumInterceptor', () => {
  let interceptor: TransformEnumInterceptor;
  let executionContext: ExecutionContext;
  let callHandler: CallHandler;

  beforeEach(() => {
    interceptor = new TransformEnumInterceptor();

    // Mocking ExecutionContext and CallHandler
    executionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          body: {
            jobType: 'FORTUNE',
            amount: 5,
            address: '0xCf88b3f1992458C2f5a229573c768D0E9F70C44e',
          },
          query: {
            jobType: 'FORTUNE',
          },
        }),
      }),
      getHandler: jest.fn().mockReturnValue({
        name: 'create', // Assume the handler is named 'create'
      }),
      getClass: jest.fn().mockReturnValue({
        prototype: {},
      }),
    } as unknown as ExecutionContext;

    callHandler = {
      handle: jest.fn().mockReturnValue(of({})),
    };

    // Mock Reflect.getMetadata to return DTO and Enum types
    Reflect.getMetadata = jest.fn((metadataKey, target, propertyKey) => {
      // Mock design:paramtypes to return MockDto as the parameter type
      if (metadataKey === 'design:paramtypes') {
        return [MockDto];
      }

      if (metadataKey === 'custom:enum' && propertyKey === 'jobType') {
        return JobRequestType;
      }
      return undefined; // For non-enum properties, return undefined
    }) as any;
  });

  it('should transform enum values in query params to lowercase', async () => {
    // Run the interceptor
    await interceptor.intercept(executionContext, callHandler).toPromise();

    // Access the modified request query
    const request = executionContext.switchToHttp().getRequest();

    // Expectations
    expect(request.query.jobType).toBe('fortune');
    expect(request.query).toEqual({
      jobType: 'fortune',
    });
    expect(callHandler.handle).toBeCalled(); // Ensure the handler is called
  });

  it('should throw an error if the query value is not a valid enum', async () => {
    // Modify the request query to have an invalid enum value for jobType
    executionContext.switchToHttp = jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        query: {
          jobType: 'invalidEnum', // Invalid enum value for jobType
        },
      }),
    });

    try {
      // Run the interceptor
      await interceptor.intercept(executionContext, callHandler).toPromise();
    } catch (err: any) {
      // Expect an error to be thrown
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.response.statusCode).toBe(400);
      expect(err.response.message).toContain('Validation failed');
    }
  });

  it('should transform enum values to lowercase', async () => {
    // Run the interceptor
    await interceptor.intercept(executionContext, callHandler).toPromise();

    // Access the modified request body
    const request = executionContext.switchToHttp().getRequest();

    // Expectations
    expect(request.body.jobType).toBe('fortune'); // Should be transformed to lowercase
    expect(request.body).toEqual({
      jobType: 'fortune',
      amount: 5,
      address: '0xCf88b3f1992458C2f5a229573c768D0E9F70C44e',
    });
    expect(callHandler.handle).toBeCalled(); // Ensure the handler is called
  });

  it('should throw an error if the value is not a valid enum', async () => {
    // Modify the request body to have an invalid enum value for jobType
    executionContext.switchToHttp = jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        body: {
          status: 'pending',
          jobType: 'invalidEnum', // Invalid enum value for jobType
          amount: 5,
          address: '0xCf88b3f1992458C2f5a229573c768D0E9F70C44e',
        },
      }),
    });

    try {
      // Run the interceptor
      await interceptor.intercept(executionContext, callHandler).toPromise();
    } catch (err: any) {
      // Expect an error to be thrown
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.response.statusCode).toBe(400);
      expect(err.response.message).toContain('Validation failed');
    }
  });

  it('should not transform non-enum properties', async () => {
    // Run the interceptor with a non-enum property (amount and address)
    await interceptor.intercept(executionContext, callHandler).toPromise();

    // Access the modified request body
    const request = executionContext.switchToHttp().getRequest();

    // Expectations
    expect(request.body.amount).toBe(5); // Non-enum property should remain unchanged
    expect(request.body.address).toBe(
      '0xCf88b3f1992458C2f5a229573c768D0E9F70C44e',
    ); // Non-enum string should remain unchanged
    expect(callHandler.handle).toBeCalled();
  });

  it('should handle nested objects with enums', async () => {
    // Modify the request body to have a nested object with enum value
    executionContext.switchToHttp = jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        body: {
          transaction: {
            jobType: 'FORTUNE',
            address: '0xCf88b3f1992458C2f5a229573c768D0E9F70C44e',
          },
          amount: 5,
          address: '0xCf88b3f1992458C2f5a229573c768D0E9F70C44e',
        },
      }),
    });

    // Run the interceptor
    await interceptor.intercept(executionContext, callHandler).toPromise();

    // Access the modified request body
    const request = executionContext.switchToHttp().getRequest();

    // Expectations
    expect(request.body.transaction.jobType).toBe('fortune');
    expect(request.body).toEqual({
      transaction: {
        jobType: 'fortune',
        address: '0xCf88b3f1992458C2f5a229573c768D0E9F70C44e',
      },
      amount: 5,
      address: '0xCf88b3f1992458C2f5a229573c768D0E9F70C44e',
    });
    expect(callHandler.handle).toHaveBeenCalled();
  });
});
