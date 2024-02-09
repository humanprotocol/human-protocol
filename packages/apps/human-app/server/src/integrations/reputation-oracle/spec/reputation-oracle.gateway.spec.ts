import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { GatewayConfigService } from '../../../common/config/gateway-config.service';
import { Mapper } from '@automapper/core';
import { of, throwError } from 'rxjs';
import { ReputationOracleGateway } from '../reputation-oracle.gateway';
import { SignupWorkerCommand } from '../../../modules/user-worker/interfaces/worker-registration.interface';
import nock from 'nock';
import { HttpException, HttpStatus } from '@nestjs/common';
import { SignupOperatorCommand } from '../../../modules/user-operator/interfaces/operator-registration.interface';
import { gatewayConfigServiceMock } from '../../../common/config/gateway-config.service.mock';

describe('ReputationOracleGateway', () => {
  let service: ReputationOracleGateway;
  let httpService: HttpService;
  let mapper: Mapper;

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
    mapper = module.get<Mapper>('automapper:nestjs:default');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendWorkerSignup', () => {
    it('should successfully call the reputation oracle worker signup endpoint', async () => {
      const command = new SignupWorkerCommand(
        'asfdsafdd@asdf.cvd',
        'asdfasdf2133!!dasfA',
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
      jest.spyOn(httpService, 'request').mockReturnValue(
        throwError(() => ({
          response: {
            data: { message: 'Bad request' },
            status: 400,
          },
        })),
      );

      const command = new SignupWorkerCommand('', '');
      await expect(service.sendWorkerSignup(command)).rejects.toThrow(
        new HttpException({ message: 'Bad request' }, 400),
      );
    });
    it('should handle network or unknown errors correctly', async () => {
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(throwError(() => new Error('Network failure')));

      const command = new SignupWorkerCommand(
        'asfdsafdd@asdf.cvd',
        'asdfasdf2133!!dasfA',
      );

      await expect(service.sendWorkerSignup(command)).rejects.toThrow(
        new HttpException(
          'Error occurred while redirecting request.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('sendOperatorSignup', () => {
    it('should successfully call the reputation oracle user-operator signup endpoint', async () => {
      const command = new SignupOperatorCommand(
        '0x2348237487df12f123a455234',
        '0x23u4dfa32423daf2314',
      );
      const expectedData = {
        email: 'asfdsafdd@asdf.cvd',
        password: 'asdfasdf2133!!dasfA',
        type: 'OPERATOR',
      };

      nock('https://expample.com')
        .post('/auth/web3/signup', expectedData)
        .reply(201, '');

      await expect(service.sendOperatorSignup(command)).resolves.not.toThrow();
      expect(httpService.request).toHaveBeenCalled();
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });
});
