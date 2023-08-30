import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SignatureAuthGuard } from './signature.auth';
import { verifySignature } from '../utils/signature';
import { MOCK_ADDRESS } from '../../../test/constants';

jest.mock('../../common/utils/signature');

describe('SignatureAuthGuard', () => {
  let guard: SignatureAuthGuard;
  let mockConfigService: Partial<ConfigService>;
  
  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignatureAuthGuard,
        { provide: ConfigService, useValue: mockConfigService }
      ],
    }).compile();

    guard = module.get<SignatureAuthGuard>(SignatureAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let context: ExecutionContext;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        switchToHttp: jest.fn().mockReturnThis(),
        getRequest: jest.fn().mockReturnThis(),
        headers: {},
        body: {},
        originalUrl: '',
      };
      context = {
        switchToHttp: jest.fn().mockReturnThis(),
        getRequest: jest.fn(() => mockRequest)
      } as any as ExecutionContext;
    });

    it('should return true if signature is verified', async () => {
      mockRequest.headers['header-signature-key'] = 'validSignature';
      jest.spyOn(guard, 'determineAddress').mockReturnValue('someAddress');
      (verifySignature as jest.Mock).mockReturnValue(true);

      const result = await guard.canActivate(context as any);
      expect(result).toBeTruthy();
    });

    it('should throw unauthorized exception if signature is not verified', async () => {
      jest.spyOn(guard, 'determineAddress').mockReturnValue('someAddress');
      (verifySignature as jest.Mock).mockReturnValue(false);

      await expect(guard.canActivate(context as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw unauthorized exception for unrecognized oracle type', async () => {
      mockRequest.originalUrl = '/some/random/path';
      await expect(guard.canActivate(context as any)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('determineAddress', () => {
    it('should return the correct address if originalUrl contains the fortune oracle type', () => {
      const mockRequest = { originalUrl: '/somepath/fortune/anotherpath' };
      const expectedAddress = MOCK_ADDRESS;
      mockConfigService.get = jest.fn().mockReturnValue(expectedAddress);

      const result = guard.determineAddress(mockRequest);

      expect(result).toEqual(expectedAddress);
    });

    it('should return the correct address if originalUrl contains the cvat oracle type', () => {
      const mockRequest = { originalUrl: '/somepath/cvat/anotherpath' };
      const expectedAddress = MOCK_ADDRESS;
      mockConfigService.get = jest.fn().mockReturnValue(expectedAddress);

      const result = guard.determineAddress(mockRequest);

      expect(result).toEqual(expectedAddress);
    });

    it('should throw BadRequestException for unrecognized oracle type', () => {
      const mockRequest = { originalUrl: '/some/random/path' };

      expect(() => {
        guard.determineAddress(mockRequest);
      }).toThrow(BadRequestException);
    });

  });
});
