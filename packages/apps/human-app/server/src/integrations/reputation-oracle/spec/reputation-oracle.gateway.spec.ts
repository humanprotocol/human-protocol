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

  afterEach(() => {
    nock.cleanAll();
  });
});
