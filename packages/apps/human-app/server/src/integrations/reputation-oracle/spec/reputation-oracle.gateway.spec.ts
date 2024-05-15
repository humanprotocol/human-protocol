import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { GatewayConfigService } from '../../../common/config/gateway-config.service';
import { of, throwError } from 'rxjs';
import { ReputationOracleGateway } from '../reputation-oracle.gateway';
import { SignupWorkerCommand } from '../../../modules/user-worker/model/worker-registration.model';
import nock from 'nock';
import { HttpException, HttpStatus } from '@nestjs/common';
import { SignupOperatorCommand } from '../../../modules/user-operator/model/operator-registration.model';
import { gatewayConfigServiceMock } from '../../../common/config/gateway-config.service.mock';
import { ethers } from 'ethers';
import { SigninWorkerCommand } from '../../../modules/user-worker/model/worker-signin.model';
import {
  EmailVerificationCommand,
  EmailVerificationData,
} from '../../../modules/email-confirmation/model/email-verification.model';
import {
  emailVerificationCommandFixture,
  emailVerificationDataFixture,
  resendEmailVerificationCommandFixture,
} from '../../../modules/email-confirmation/spec/email-verification.fixtures';
import {
  ResendEmailVerificationCommand,
  ResendEmailVerificationData,
} from '../../../modules/email-confirmation/model/resend-email-verification.model';
import {
  ForgotPasswordCommand,
  ForgotPasswordData,
} from '../../../modules/password-reset/model/forgot-password.model';
import {
  forgotPasswordCommandFixture,
  forgotPasswordDataFixture,
  restorePasswordCommandFixture,
  restorePasswordDataFixture,
} from '../../../modules/password-reset/spec/password-reset.fixtures';
import {
  RestorePasswordCommand,
  RestorePasswordData,
} from '../../../modules/password-reset/model/restore-password.model';
import {
  PrepareSignatureCommand,
  PrepareSignatureData,
} from '../../../modules/prepare-signature/model/prepare-signature.model';
import {
  disableOperatorCommandFixture,
  disableOperatorDataFixture,
} from '../../../modules/disable-operator/spec/disable-operator.fixtures';
import {
  DisableOperatorCommand,
  DisableOperatorData,
} from '../../../modules/disable-operator/model/disable-operator.model';
import {
  prepareSignatureCommandFixture,
  prepareSignatureDataFixture,
} from '../../../modules/prepare-signature/spec/prepare-signature.fixtures';

describe('ReputationOracleGateway', () => {
  let service: ReputationOracleGateway;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReputationOracleGateway,
        GatewayConfigService,
        {
          provide: HttpService,
          useValue: {
            request: jest.fn().mockReturnValue(of({ data: 'mocked response' })),
          },
        },
        {
          provide: 'automapper:nestjs:default',
          useValue: {
            map: jest.fn((source, _, destination) => ({
              ...source,
              type: destination,
            })),
          },
        },
      ],
    })
      .overrideProvider(GatewayConfigService)
      .useValue(gatewayConfigServiceMock)
      .compile();

    service = module.get<ReputationOracleGateway>(ReputationOracleGateway);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendWorkerSignup', () => {
    it('should successfully call the reputation oracle worker signup endpoint', async () => {
      const command = new SignupWorkerCommand(
        'asfdsafdd@asdf.cvd',
        'asdfasdf2133!!dasfA',
        'Bearer sadf234efaddasf234sadgv43rz89al',
      );
      const expectedData = {
        email: 'asfdsafdd@asdf.cvd',
        password: 'asdfasdf2133!!dasfA',
        type: 'WORKER',
      };

      nock('https://expample.com')
        .post('/auth/signup', expectedData)
        .reply(201, '');

      await expect(service.sendWorkerSignup(command)).resolves.not.toThrow();
      expect(httpService.request).toHaveBeenCalled();
    });
    it('should handle http error response correctly', async () => {
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(
          throwError(
            () =>
              new HttpException(
                { message: 'Bad request' },
                HttpStatus.BAD_REQUEST,
              ),
          ),
        );

      const command = new SignupWorkerCommand('', '', '');
      await expect(service.sendWorkerSignup(command)).rejects.toThrow(
        new HttpException({ message: 'Bad request' }, HttpStatus.BAD_REQUEST),
      );
    });

    it('should handle network or unknown errors correctly', async () => {
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(throwError(() => new Error('Internal Server Error')));

      const command = new SignupWorkerCommand(
        'asfdsafdd@asdf.cvd',
        'asdfasdf2133!!dasfA',
        'Bearer sadf234efaddasf234sadgv43rz89al',
      );

      await expect(service.sendWorkerSignup(command)).rejects.toThrow(
        new HttpException(
          'Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('sendOperatorSignup', () => {
    let exampleCommand: SignupOperatorCommand;
    beforeEach(async () => {
      const wallet = ethers.Wallet.createRandom();
      exampleCommand = new SignupOperatorCommand(
        wallet.address,
        await wallet.signMessage('signup'),
      );
    });
    it('should successfully call the reputation oracle operator signup endpoint', async () => {
      const expectedData = {
        address: exampleCommand.address,
        signature: exampleCommand.signature,
        type: 'OPERATOR',
      };

      nock('https://expample.com')
        .post('/auth/web3/signup', expectedData)
        .reply(201, '');

      await expect(
        service.sendOperatorSignup(exampleCommand),
      ).resolves.not.toThrow();
      expect(httpService.request).toHaveBeenCalled();
    });
  });

  describe('sendWorkerSignin', () => {
    it('should successfully call the reputation oracle worker signin endpoint', async () => {
      const command: SigninWorkerCommand = {
        email: 'johndoe@example.com',
        password: 's3cr3tP@ssw0rd',
        hCaptchaToken: 'token',
      };
      const expectedData = {
        email: 'johndoe@example.com',
        password: 's3cr3tP@ssw0rd',
        h_captcha_token: 'token',
      };

      nock('https://expample.com')
        .post('/auth/signin', expectedData)
        .reply(201, '');

      await expect(service.sendWorkerSignin(command)).resolves.not.toThrow();
      expect(httpService.request).toHaveBeenCalled();
    });

    it('should handle http error response correctly', async () => {
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(
          throwError(
            () =>
              new HttpException(
                { message: 'Bad request' },
                HttpStatus.BAD_REQUEST,
              ),
          ),
        );

      const command: SigninWorkerCommand = {
        email: '',
        password: '',
        hCaptchaToken: '',
      };
      await expect(service.sendWorkerSignin(command)).rejects.toThrow(
        new HttpException({ message: 'Bad request' }, 400),
      );
    });
    it('should handle network or unknown errors correctly', async () => {
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(throwError(() => new Error('Internal Server Error')));

      const command: SigninWorkerCommand = {
        email: 'johndoe@example.com',
        password: 's3cr3tP@ssw0rd',
        hCaptchaToken: 'token',
      };

      await expect(service.sendWorkerSignin(command)).rejects.toThrow(
        new HttpException(
          'Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('sendEmailVerification', () => {
    it('should successfully call the reputation oracle email verification endpoint', async () => {
      const command: EmailVerificationCommand = emailVerificationCommandFixture;
      const data: EmailVerificationData = emailVerificationDataFixture;
      nock('https://expample.com')
        .post('/email-confirmation/email-verification', {
          ...data,
        })
        .reply(201, '');
      await expect(
        service.sendEmailVerification(command),
      ).resolves.not.toThrow();
      expect(httpService.request).toHaveBeenCalled();
    });

    it('should handle http error response correctly', async () => {
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(
          throwError(
            () =>
              new HttpException(
                { message: 'Bad request' },
                HttpStatus.BAD_REQUEST,
              ),
          ),
        );

      const command: EmailVerificationCommand = emailVerificationCommandFixture;
      await expect(service.sendEmailVerification(command)).rejects.toThrow(
        new HttpException({ message: 'Bad request' }, HttpStatus.BAD_REQUEST),
      );
    });

    it('should handle network or unknown errors correctly', async () => {
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(throwError(() => new Error('Internal Server Error')));

      const command: EmailVerificationCommand = emailVerificationCommandFixture;
      await expect(service.sendEmailVerification(command)).rejects.toThrow(
        new HttpException(
          'Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('resendSendEmailVerification', () => {
    it('should successfully call the reputation oracle endpoint', async () => {
      const command: ResendEmailVerificationCommand =
        resendEmailVerificationCommandFixture;
      const data: ResendEmailVerificationData = {
        ...command.data,
      };
      nock('https://expample.com')
        .post('/email-confirmation/resend-email-verification', {
          ...data,
        })
        .reply(201, '');
      await expect(
        service.sendResendEmailVerification(command),
      ).resolves.not.toThrow();
      expect(httpService.request).toHaveBeenCalled();
    });

    it('should handle http error response correctly', async () => {
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(
          throwError(
            () =>
              new HttpException(
                { message: 'Bad request' },
                HttpStatus.BAD_REQUEST,
              ),
          ),
        );

      const command: ResendEmailVerificationCommand =
        resendEmailVerificationCommandFixture;
      await expect(
        service.sendResendEmailVerification(command),
      ).rejects.toThrow(
        new HttpException({ message: 'Bad request' }, HttpStatus.BAD_REQUEST),
      );
    });

    it('should handle network or unknown errors correctly', async () => {
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(throwError(() => new Error('Internal Server Error')));

      const command: ResendEmailVerificationCommand =
        resendEmailVerificationCommandFixture;
      await expect(
        service.sendResendEmailVerification(command),
      ).rejects.toThrow(
        new HttpException(
          'Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('sendForgotPassword', () => {
    it('should successfully call the reputation oracle endpoint', async () => {
      const command: ForgotPasswordCommand = forgotPasswordCommandFixture;
      const data: ForgotPasswordData = forgotPasswordDataFixture;
      nock('https://expample.com')
        .post('/password-reset/forgot-password', {
          ...data,
        })
        .reply(201, '');
      await expect(service.sendForgotPassword(command)).resolves.not.toThrow();
      expect(httpService.request).toHaveBeenCalled();
    });

    it('should handle http error response correctly', async () => {
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(
          throwError(
            () =>
              new HttpException(
                { message: 'Bad request' },
                HttpStatus.BAD_REQUEST,
              ),
          ),
        );

      const command: ForgotPasswordCommand = forgotPasswordCommandFixture;
      await expect(service.sendForgotPassword(command)).rejects.toThrow(
        new HttpException({ message: 'Bad request' }, HttpStatus.BAD_REQUEST),
      );
    });

    it('should handle network or unknown errors correctly', async () => {
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(throwError(() => new Error('Internal Server Error')));

      const command: ForgotPasswordCommand = forgotPasswordCommandFixture;
      await expect(service.sendForgotPassword(command)).rejects.toThrow(
        new HttpException(
          'Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('sendRestorePassword', () => {
    it('should successfully call the reputation oracle endpoint', async () => {
      const command: RestorePasswordCommand = restorePasswordCommandFixture;
      const data: RestorePasswordData = restorePasswordDataFixture;
      nock('https://expample.com')
        .post('/password-reset/restore-password', {
          ...data,
        })
        .reply(201, '');
      await expect(service.sendRestorePassword(command)).resolves.not.toThrow();
      expect(httpService.request).toHaveBeenCalled();
    });

    it('should handle http error response correctly', async () => {
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(
          throwError(
            () =>
              new HttpException(
                { message: 'Bad request' },
                HttpStatus.BAD_REQUEST,
              ),
          ),
        );

      const command: RestorePasswordCommand = restorePasswordCommandFixture;
      await expect(service.sendRestorePassword(command)).rejects.toThrow(
        new HttpException({ message: 'Bad request' }, HttpStatus.BAD_REQUEST),
      );
    });

    it('should handle network or unknown errors correctly', async () => {
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(throwError(() => new Error('Internal Server Error')));

      const command: RestorePasswordCommand = restorePasswordCommandFixture;
      await expect(service.sendRestorePassword(command)).rejects.toThrow(
        new HttpException(
          'Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('sendPrepareSignature', () => {
    it('should successfully call the reputation oracle endpoint', async () => {
      const command: PrepareSignatureCommand = prepareSignatureCommandFixture;
      const data: PrepareSignatureData = prepareSignatureDataFixture;
      nock('https://expample.com')
        .post('/prepare-signature', {
          ...data,
        })
        .reply(201, '');
      await expect(
        service.sendPrepareSignature(command),
      ).resolves.not.toThrow();
      expect(httpService.request).toHaveBeenCalled();
    });

    it('should handle http error response correctly', async () => {
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(
          throwError(
            () =>
              new HttpException(
                { message: 'Bad request' },
                HttpStatus.BAD_REQUEST,
              ),
          ),
        );

      const command: PrepareSignatureCommand = prepareSignatureCommandFixture;
      await expect(service.sendPrepareSignature(command)).rejects.toThrow(
        new HttpException({ message: 'Bad request' }, HttpStatus.BAD_REQUEST),
      );
    });

    it('should handle network or unknown errors correctly', async () => {
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(throwError(() => new Error('Internal Server Error')));

      const command: PrepareSignatureCommand = prepareSignatureCommandFixture;
      await expect(service.sendPrepareSignature(command)).rejects.toThrow(
        new HttpException(
          'Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('sendDisableOperator', () => {
    it('should successfully call the reputation oracle endpoint', async () => {
      const command: DisableOperatorCommand = disableOperatorCommandFixture;
      const data: DisableOperatorData = disableOperatorDataFixture;
      nock('https://expample.com')
        .post('/disable-operator', {
          ...data,
        })
        .reply(201, '');
      await expect(service.sendDisableOperator(command)).resolves.not.toThrow();
      expect(httpService.request).toHaveBeenCalled();
    });

    it('should handle http error response correctly', async () => {
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(
          throwError(
            () =>
              new HttpException(
                { message: 'Bad request' },
                HttpStatus.BAD_REQUEST,
              ),
          ),
        );

      const command: DisableOperatorCommand = disableOperatorCommandFixture;
      await expect(service.sendDisableOperator(command)).rejects.toThrow(
        new HttpException({ message: 'Bad request' }, HttpStatus.BAD_REQUEST),
      );
    });

    it('should handle network or unknown errors correctly', async () => {
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(throwError(() => new Error('Internal Server Error')));

      const command: DisableOperatorCommand = disableOperatorCommandFixture;
      await expect(service.sendDisableOperator(command)).rejects.toThrow(
        new HttpException(
          'Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('sendKycProcedureStart', () => {
    it('should successfully call the reputation oracle endpoint', async () => {
      nock('https://expample.com').post('/kyc/start', {}).reply(201, '');
      await expect(service.sendKycProcedureStart('token')).resolves.not.toThrow();
      expect(httpService.request).toHaveBeenCalled();
    });

    it('should handle http error response correctly', async () => {
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(
          throwError(
            () =>
              new HttpException(
                { message: 'Bad request' },
                HttpStatus.BAD_REQUEST,
              ),
          ),
        );

      await expect(service.sendKycProcedureStart('token')).rejects.toThrow(
        new HttpException({ message: 'Bad request' }, HttpStatus.BAD_REQUEST),
      );
    });

    it('should handle network or unknown errors correctly', async () => {
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(throwError(() => new Error('Internal Server Error')));

      await expect(service.sendKycProcedureStart('token')).rejects.toThrow(
        new HttpException(
          'Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });
});
