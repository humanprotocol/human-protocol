import { faker } from '@faker-js/faker';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

import {
  createExecutionContextMock,
  ExecutionContextMock,
} from '../../../test/mock-creators/nest';

import { HCaptchaGuard } from './hcaptcha.guard';
import { AuthConfigService } from 'src/config/auth-config.service';
import { HCaptchaService } from './hcaptcha.service';

const mockHCaptchaService = {
  verifyToken: jest.fn(),
};
const mockAuthConfigService: Partial<AuthConfigService> = {
  humanAppEmail: faker.internet.email(),
};

describe('HCaptchaGuard', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('canActivate', () => {
    let hCaptchaGuard: HCaptchaGuard;
    let executionContextMock: ExecutionContextMock;

    beforeAll(() => {
      hCaptchaGuard = new HCaptchaGuard(
        mockHCaptchaService as unknown as HCaptchaService,
        mockAuthConfigService as unknown as AuthConfigService,
      );
    });

    beforeEach(() => {
      executionContextMock = createExecutionContextMock();
    });

    it('should return true and skip verify if human app signin', async () => {
      const request = {
        path: '/auth/web2/signin',
        body: {
          email: mockAuthConfigService.humanAppEmail,
        },
      };
      executionContextMock.__getRequest.mockReturnValueOnce(request);

      const result = await hCaptchaGuard.canActivate(
        executionContextMock as unknown as ExecutionContext,
      );

      expect(result).toBe(true);
    });

    it('should verify and return true if not human app signin', async () => {
      const testToken = faker.string.alphanumeric();

      const request = {
        path: '/auth/web2/signin',
        body: {
          email: faker.internet.email(),
          h_captcha_token: testToken,
        },
      };
      executionContextMock.__getRequest.mockReturnValueOnce(request);

      mockHCaptchaService.verifyToken.mockResolvedValueOnce(true);

      const result = await hCaptchaGuard.canActivate(
        executionContextMock as unknown as ExecutionContext,
      );

      expect(result).toBe(true);
      expect(mockHCaptchaService.verifyToken).toHaveBeenCalledTimes(1);
      expect(mockHCaptchaService.verifyToken).toHaveBeenCalledWith(testToken);
    });

    it('should verify and return true if not signin route', async () => {
      const testToken = faker.string.alphanumeric();

      const request = {
        path: `/not-signin-route`,
        body: {
          email: mockAuthConfigService.humanAppEmail,
          h_captcha_token: testToken,
        },
      };
      executionContextMock.__getRequest.mockReturnValueOnce(request);

      mockHCaptchaService.verifyToken.mockResolvedValueOnce(true);

      const result = await hCaptchaGuard.canActivate(
        executionContextMock as unknown as ExecutionContext,
      );

      expect(result).toBe(true);
      expect(mockHCaptchaService.verifyToken).toHaveBeenCalledTimes(1);
      expect(mockHCaptchaService.verifyToken).toHaveBeenCalledWith(testToken);
    });

    it('should throw bad request exception if token is not provided', async () => {
      const request = {
        body: {
          email: mockAuthConfigService.humanAppEmail,
        },
      };
      executionContextMock.__getRequest.mockReturnValueOnce(request);

      let thrownError;
      try {
        await hCaptchaGuard.canActivate(
          executionContextMock as unknown as ExecutionContext,
        );
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(HttpException);
      expect(thrownError.message).toBe('hCaptcha token not provided');
      expect(thrownError.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should throw bad request exception if token is not verified', async () => {
      executionContextMock.__getRequest.mockReturnValueOnce({
        body: {
          h_captcha_token: faker.string.alphanumeric(),
        },
      });

      mockHCaptchaService.verifyToken.mockResolvedValueOnce(false);

      let thrownError;
      try {
        await hCaptchaGuard.canActivate(
          executionContextMock as unknown as ExecutionContext,
        );
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(HttpException);
      expect(thrownError.message).toBe('Invalid hCaptcha token');
      expect(thrownError.status).toBe(HttpStatus.BAD_REQUEST);
    });
  });
});
