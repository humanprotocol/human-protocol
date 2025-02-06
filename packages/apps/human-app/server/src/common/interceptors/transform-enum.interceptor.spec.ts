import { TransformEnumInterceptor } from './transform-enum.interceptor';
import {
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { of } from 'rxjs';
import { IsNumber, IsString, Min } from 'class-validator';
import { UserType } from '../../common/enums/user';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnumCaseInsensitive } from '../decorators';

export class MockDto {
  @ApiProperty({
    enum: UserType,
  })
  @IsEnumCaseInsensitive(UserType)
  public userType: UserType;

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
            userType: 'OPERATOR',
            amount: 5,
            address: '0xCf88b3f1992458C2f5a229573c768D0E9F70C44e',
          },
          query: {
            userType: 'OPERATOR',
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
    Reflect.getMetadata = jest.fn((metadataKey, _, propertyKey) => {
      // Mock design:paramtypes to return MockDto as the parameter type
      if (metadataKey === 'design:paramtypes') {
        return [MockDto];
      }

      // Mock custom:enum to return the corresponding enum for each property
      if (metadataKey === 'custom:enum' && propertyKey === 'userType') {
        return UserType;
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
    expect(request.query.userType).toBe('operator');
    expect(request.query).toEqual({
      userType: 'operator',
    });
    expect(callHandler.handle).toBeCalled(); // Ensure the handler is called
  });

  it('should throw an error if the query value is not a valid enum', async () => {
    // Modify the request query to have an invalid enum value for userType
    executionContext.switchToHttp = jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        query: {
          userType: 'invalidEnum', // Invalid enum value for userType
        },
      }),
    });

    try {
      // Run the interceptor
      await interceptor.intercept(executionContext, callHandler).toPromise();
    } catch (err) {
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
    expect(request.body.userType).toBe('operator'); // Should be transformed to lowercase
    expect(request.body).toEqual({
      userType: 'operator',
      amount: 5,
      address: '0xCf88b3f1992458C2f5a229573c768D0E9F70C44e',
    });
    expect(callHandler.handle).toBeCalled(); // Ensure the handler is called
  });

  it('should throw an error if the value is not a valid enum', async () => {
    // Modify the request body to have an invalid enum value for userType
    executionContext.switchToHttp = jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        body: {
          userType: 'invalidEnum', // Invalid enum value for userType
          amount: 5,
          address: '0xCf88b3f1992458C2f5a229573c768D0E9F70C44e',
        },
      }),
    });

    try {
      // Run the interceptor
      await interceptor.intercept(executionContext, callHandler).toPromise();
    } catch (err) {
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
            userType: 'OPERATOR',
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
    expect(request.body.transaction.userType).toBe('operator');
    expect(request.body).toEqual({
      transaction: {
        userType: 'operator',
        address: '0xCf88b3f1992458C2f5a229573c768D0E9F70C44e',
      },
      amount: 5,
      address: '0xCf88b3f1992458C2f5a229573c768D0E9F70C44e',
    });
    expect(callHandler.handle).toHaveBeenCalled();
  });

  it('should return bodyOrQuery if instance is not an object', () => {
    // Test with `null` as the instance
    let result = interceptor['lowercaseEnumProperties']( 
      { status: 'PENDING' }, 
      null,
      MockDto
    );
    expect(result).toEqual({ status: 'PENDING' });
  
    // Test with `undefined` as the instance
    result = interceptor['lowercaseEnumProperties']( 
      { status: 'PENDING' }, 
      undefined,
      MockDto
    );
    expect(result).toEqual({ status: 'PENDING' });
  
    // Test with a primitive value (string) as the instance
    result = interceptor['lowercaseEnumProperties']( 
      { status: 'PENDING' }, 
      'some string',
      MockDto
    );
    expect(result).toEqual({ status: 'PENDING' });
  
    // Test with a primitive value (number) as the instance
    result = interceptor['lowercaseEnumProperties']( 
      { status: 'PENDING' }, 
      123,
      MockDto
    );
    expect(result).toEqual({ status: 'PENDING' });
  });
});
