import { EnumTransformInterceptor } from './enum-insensitive';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { Test } from '@nestjs/testing';

describe('EnumTransformInterceptor', () => {
  let interceptor: EnumTransformInterceptor;
  let mockContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [EnumTransformInterceptor],
    }).compile();

    interceptor = moduleRef.get<EnumTransformInterceptor>(
      EnumTransformInterceptor,
    );

    mockContext = {
      switchToHttp: jest.fn().mockReturnThis(),
      getRequest: jest.fn(),
      getResponse: jest.fn(),
    } as unknown as ExecutionContext;

    mockCallHandler = {
      handle: jest.fn(() => of({})),
    };
  });

  describe('transformEnums', () => {
    it('should transform string values to lowercase', () => {
      const body = {
        key1: 'VALUE1',
        key2: 'VALUE2',
      };

      interceptor['transformEnums'](body);

      expect(body).toEqual({
        key1: 'value1',
        key2: 'value2',
      });
    });

    it('should transform nested object values to lowercase', () => {
      const body = {
        key1: 'VALUE1',
        nested: {
          key2: 'VALUE2',
        },
      };

      interceptor['transformEnums'](body);

      expect(body).toEqual({
        key1: 'value1',
        nested: {
          key2: 'value2',
        },
      });
    });

    it('should not transform non-string values', () => {
      const body = {
        key1: 'VALUE1',
        key2: 123,
        key3: true,
      };

      interceptor['transformEnums'](body);

      expect(body).toEqual({
        key1: 'value1',
        key2: 123,
        key3: true,
      });
    });

    it('should handle null or non-object values gracefully', () => {
      const body = null;

      expect(interceptor['transformEnums'](body)).toBeNull();
    });
  });

  describe('intercept', () => {
    it('should transform request body and pass it to the next handler', (done) => {
      const mockRequest = {
        body: {
          key1: 'VALUE1',
          key2: 'VALUE2',
        },
      };

      jest.spyOn(mockContext, 'switchToHttp').mockReturnValue({
        getRequest: () => mockRequest,
      } as any);

      const mockData = { data: 'response' };
      mockCallHandler.handle = jest.fn(() => of(mockData));

      interceptor
        .intercept(mockContext, mockCallHandler)
        .subscribe((result: any) => {
          expect(mockRequest.body).toEqual({
            key1: 'value1',
            key2: 'value2',
          });

          expect(result).toEqual(mockData);
          done();
        });
    });
  });
});
