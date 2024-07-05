import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { GatewayConfigService } from '../../../common/config/gateway-config.service';
import { of, throwError } from 'rxjs';
import { ReputationOracleGateway } from '../reputation-oracle.gateway';
import nock from 'nock';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ethers } from 'ethers';
import { AxiosRequestConfig } from 'axios';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { ReputationOracleProfile } from '../reputation-oracle.mapper.profile';
import { gatewayConfigServiceMock } from '../../../common/config/spec/gateway-config-service.mock';
import { SignupWorkerCommand } from '../../../modules/user-worker/model/worker-registration.model';
import { SignupOperatorCommand } from '../../../modules/user-operator/model/operator-registration.model';
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
import { PrepareSignatureCommand } from '../../../modules/prepare-signature/model/prepare-signature.model';
import {
  prepareSignatureCommandFixture,
  prepareSignatureDataFixture,
  prepareSignatureResponseFixture,
} from '../../../modules/prepare-signature/spec/prepare-signature.fixtures';
import {
  disableOperatorCommandFixture,
  disableOperatorDataFixture,
} from '../../../modules/disable-operator/spec/disable-operator.fixtures';
import {
  DisableOperatorCommand,
  DisableOperatorData,
} from '../../../modules/disable-operator/model/disable-operator.model';
import { EnableLabelingCommand } from '../../../modules/h-captcha/model/enable-labeling.model';
import {
  enableLabelingCommandFixture,
  enableLabelingResponseFixture,
} from '../../../modules/h-captcha/spec/h-captcha.fixtures';
import {
  REGISTER_ADDRESS_TOKEN,
  registerAddressCommandFixture,
  registerAddressDataFixture,
  registerAddressResponseFixture,
} from '../../../modules/register-address/spec/register-address.fixtures';
import {
  TokenRefreshCommand,
  TokenRefreshData,
} from '../../../modules/token-refresh/model/token-refresh.model';
import {
  SigninOperatorCommand,
  SigninOperatorData,
} from '../../../modules/user-operator/model/operator-signin.model';

const httpServiceMock = {
  request: jest.fn(),
};

describe('ReputationOracleGateway', () => {
  let service: ReputationOracleGateway;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      providers: [
        ReputationOracleGateway,
        GatewayConfigService,
        {
          provide: HttpService,
          useValue: httpServiceMock,
        },
        ReputationOracleProfile,
      ],
    })
      .overrideProvider(GatewayConfigService)
      .useValue(gatewayConfigServiceMock)
      .compile();

    service = module.get<ReputationOracleGateway>(ReputationOracleGateway);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    nock.cleanAll();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendWorkerSignup', () => {
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

    it('should successfully call the reputation oracle worker signup endpoint', async () => {
      nock('https://example.com')
        .post('/auth/signup', expectedData)
        .reply(201, '');

      httpServiceMock.request.mockReturnValue(of({}));

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

      await expect(service.sendWorkerSignup(command)).rejects.toThrow(
        new HttpException(
          'Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('sendOperatorSignin', () => {
    let exampleCommand: SigninOperatorCommand;

    beforeEach(async () => {
      const wallet = ethers.Wallet.createRandom();
      exampleCommand = {
        address: wallet.address,
        signature: await wallet.signMessage('signin'),
      };
    });

    it('should successfully call the reputation oracle operator signin endpoint', async () => {
      const expectedData = {
        address: exampleCommand.address,
        signature: exampleCommand.signature,
      } as SigninOperatorData;
      const expectedOptions: AxiosRequestConfig = {
        method: 'POST',
        url: `https://example.com/auth/web3/signin`,
        headers: { 'Content-Type': 'application/json' },
        data: expectedData,
        params: {},
      };

      httpServiceMock.request.mockReturnValue(
        of({
          data: {
            refresh_token: 'string',
            access_token: 'string',
          },
        }),
      );

      await service.sendOperatorSignin(exampleCommand);
      expect(httpService.request).toHaveBeenCalledWith(expectedOptions);
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

      httpServiceMock.request.mockReturnValue(of({}));

      await expect(
        service.sendOperatorSignup(exampleCommand),
      ).resolves.not.toThrow();
      expect(httpService.request).toHaveBeenCalled();
    });
  });

  describe('sendWorkerSignin', () => {
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

    it('should successfully call the reputation oracle worker signin endpoint', async () => {
      nock('https://example.com')
        .post('/auth/signin', expectedData)
        .reply(201, '');

      httpServiceMock.request.mockReturnValue(of({}));

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

      const invalidCommand: SigninWorkerCommand = {
        email: '',
        password: '',
        hCaptchaToken: '',
      };

      await expect(service.sendWorkerSignin(invalidCommand)).rejects.toThrow(
        new HttpException({ message: 'Bad request' }, HttpStatus.BAD_REQUEST),
      );
    });

    it('should handle network or unknown errors correctly', async () => {
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(throwError(() => new Error('Internal Server Error')));

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

      nock('https://example.com')
        .post('/email-confirmation/email-verification', { ...data })
        .reply(201, '');

      httpServiceMock.request.mockReturnValue(of({}));

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

  describe('sendResendEmailVerification', () => {
    it('should successfully call the reputation oracle endpoint', async () => {
      const command: ResendEmailVerificationCommand =
        resendEmailVerificationCommandFixture;
      const data: ResendEmailVerificationData = {
        ...command.data,
      };
      nock('https://example.com')
        .post('/auth/resend-email-verification', {
          ...data,
        })
        .reply(201, '');

      httpServiceMock.request.mockReturnValue(of({}));

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
      nock('https://example.com')
        .post('/auth/forgot-password', {
          ...data,
        })
        .reply(201, '');

      httpServiceMock.request.mockReturnValue(of({}));

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

      await expect(
        service.sendForgotPassword(forgotPasswordCommandFixture),
      ).rejects.toThrow(
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
      nock('https://example.com')
        .post('/auth/restore-password', {
          ...data,
        })
        .reply(201, '');

      httpServiceMock.request.mockReturnValue(of({}));

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

      await expect(
        service.sendRestorePassword(restorePasswordCommandFixture),
      ).rejects.toThrow(
        new HttpException({ message: 'Bad request' }, HttpStatus.BAD_REQUEST),
      );
    });

    it('should handle network or unknown errors correctly', async () => {
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(throwError(() => new Error('Internal Server Error')));

      await expect(
        service.sendRestorePassword(restorePasswordCommandFixture),
      ).rejects.toThrow(
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
      httpServiceMock.request.mockReturnValue(
        of(prepareSignatureResponseFixture),
      );

      const expectedOptions: AxiosRequestConfig = {
        method: 'POST',
        url: `https://example.com/user/prepare-signature`,
        headers: { 'Content-Type': 'application/json' },
        data: prepareSignatureDataFixture,
        params: {},
      };

      await expect(
        service.sendPrepareSignature(command),
      ).resolves.not.toThrow();
      expect(httpService.request).toHaveBeenCalledWith(expectedOptions);
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

      await expect(
        service.sendPrepareSignature(prepareSignatureCommandFixture),
      ).rejects.toThrow(
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
      nock('https://example.com')
        .post('/user/disable-operator', {
          ...data,
        })
        .reply(201, '');

      httpServiceMock.request.mockReturnValue(of({}));

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

      await expect(
        service.sendDisableOperator(disableOperatorCommandFixture),
      ).rejects.toThrow(
        new HttpException({ message: 'Bad request' }, HttpStatus.BAD_REQUEST),
      );
    });

    it('should handle network or unknown errors correctly', async () => {
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(throwError(() => new Error('Internal Server Error')));

      await expect(
        service.sendDisableOperator(disableOperatorCommandFixture),
      ).rejects.toThrow(
        new HttpException(
          'Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });
  describe('sendKycOnChain', () => {
    it('should succesfully call the reputation oracle endpoint', async () => {
      nock('https://example.com').post('/kyc/on-chain', {}).reply(200, '');
      httpServiceMock.request.mockReturnValue(of({}));
      await expect(
        service.sendKycProcedureStart('token'),
      ).resolves.not.toThrow();
      expect(httpService.request).toHaveBeenCalled();
    });
  });

  describe('sendKycProcedureStart', () => {
    it('should successfully call the reputation oracle endpoint', async () => {
      nock('https://example.com').post('/kyc/start', {}).reply(201, '');
      httpServiceMock.request.mockReturnValue(of({}));
      await expect(
        service.sendKycProcedureStart('token'),
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

  describe('approveUserAsLabeler', () => {
    it('should successfully call the reputation oracle enable labeling endpoint', async () => {
      const command: EnableLabelingCommand = enableLabelingCommandFixture;

      nock('https://example.com')
        .post('/labeler/register', {})
        .reply(201, enableLabelingResponseFixture);

      httpServiceMock.request.mockReturnValue(of({}));

      await expect(
        service.approveUserAsLabeler(command),
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

      await expect(
        service.approveUserAsLabeler(enableLabelingCommandFixture),
      ).rejects.toThrow(
        new HttpException({ message: 'Bad request' }, HttpStatus.BAD_REQUEST),
      );
    });

    it('should handle network or unknown errors correctly', async () => {
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(throwError(() => new Error('Internal Server Error')));

      await expect(
        service.approveUserAsLabeler(enableLabelingCommandFixture),
      ).rejects.toThrow(
        new HttpException(
          'Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });
  describe('sendBlockchainAddressRegistration', () => {
    it('should successfully call the reputation oracle blockchain address registration endpoint', async () => {
      const expectedOptions: AxiosRequestConfig = {
        method: 'POST',
        url: `https://example.com/user/register-address`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: REGISTER_ADDRESS_TOKEN,
        },
        data: registerAddressDataFixture,
        params: {},
      };

      httpServiceMock.request.mockReturnValue(
        of({
          data: registerAddressResponseFixture,
        }),
      );

      await service.sendBlockchainAddressRegistration(
        registerAddressCommandFixture,
      );
      expect(httpService.request).toHaveBeenCalledWith(expectedOptions);
    });
  });

  describe('sendRefeshToken', () => {
    it('should successfully call the reputation oracle endpoint', async () => {
      const command: TokenRefreshCommand = {
        refreshToken: 'token',
      };
      const data: TokenRefreshData = {
        refresh_token: command.refreshToken,
      };
      nock('https://example.com')
        .post('/auth/refresh', {
          ...data,
        })
        .reply(201, '');

      httpServiceMock.request.mockReturnValue(of({}));

      await expect(service.sendRefreshToken(command)).resolves.not.toThrow();
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

      const command: TokenRefreshCommand = {
        refreshToken: 'token',
      };
      await expect(service.sendRefreshToken(command)).rejects.toThrow(
        new HttpException({ message: 'Bad request' }, HttpStatus.BAD_REQUEST),
      );
    });

    it('should handle network or unknown errors correctly', async () => {
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(throwError(() => new Error('Internal Server Error')));

      const command: TokenRefreshCommand = {
        refreshToken: 'token',
      };
      await expect(service.sendRefreshToken(command)).rejects.toThrow(
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
