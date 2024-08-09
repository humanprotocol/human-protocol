import { Test, TestingModule } from '@nestjs/testing';
import { WorkerService } from '../worker.service';
import { ReputationOracleGateway } from '../../../integrations/reputation-oracle/reputation-oracle.gateway';
import { reputationOracleGatewayMock } from '../../../integrations/reputation-oracle/spec/reputation-oracle.gateway.mock';
import { SignupWorkerCommand } from '../model/worker-registration.model';
import { ExchangeOracleGateway } from '../../../integrations/exchange-oracle/exchange-oracle.gateway';
import { exchangeOracleGatewayMock } from '../../../integrations/exchange-oracle/spec/exchange-oracle.gateway.mock';
import { KvStoreGateway } from '../../../integrations/kv-store/kv-store.gateway';
import { EnvironmentConfigService } from '../../../common/config/environment-config.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { kvStoreGatewayMock } from '../../../integrations/kv-store/spec/kv-store.gateway.mock';

describe('WorkerService', () => {
  let service: WorkerService;
  let reputationOracleGateway: ReputationOracleGateway;
  let exchangeOracleGateway: ExchangeOracleGateway;
  let kvStoreGateway: KvStoreGateway;
  let cacheManagerMock: any;
  let configServiceMock: Partial<EnvironmentConfigService>;

  beforeEach(async () => {
    cacheManagerMock = {
      get: jest.fn(),
      set: jest.fn(),
    };

    configServiceMock = {
      email: 'human-app@hmt.ai',
      password: 'Test1234*',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkerService,
        ReputationOracleGateway,
        ExchangeOracleGateway,
        KvStoreGateway,
        { provide: EnvironmentConfigService, useValue: configServiceMock },
        { provide: CACHE_MANAGER, useValue: cacheManagerMock },
      ],
    })
      .overrideProvider(ReputationOracleGateway)
      .useValue(reputationOracleGatewayMock)
      .overrideProvider(ExchangeOracleGateway)
      .useValue(exchangeOracleGatewayMock)
      .overrideProvider(KvStoreGateway)
      .useValue(kvStoreGatewayMock)
      .compile();

    service = module.get<WorkerService>(WorkerService);
    reputationOracleGateway = module.get<ReputationOracleGateway>(
      ReputationOracleGateway,
    );
    exchangeOracleGateway = module.get<ExchangeOracleGateway>(
      ExchangeOracleGateway,
    );
    kvStoreGateway = module.get<KvStoreGateway>(KvStoreGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signupWorker', () => {
    it('should call reputation oracle gateway without doing anything else', async () => {
      const command: SignupWorkerCommand = {
        email: 'email@example.com',
        password: 'Pa55word!',
        hCaptchaToken: 'hcaptchatkn',
      };
      await service.signupWorker(command);
      expect(reputationOracleGateway.sendWorkerSignup).toHaveBeenCalledWith(
        command,
      );
    });
  });

  describe('signinWorker', () => {
    it('should call reputation oracle gateway without doing anything else', async () => {
      const command = {
        email: 'email@example.com',
        password: 'Pa55word!',
        hCaptchaToken: 'token',
      };
      await service.signinWorker(command);
      expect(reputationOracleGateway.sendWorkerSignin).toHaveBeenCalledWith(
        command,
      );
    });
  });

  describe('registerWorker', () => {
    it('should call reputation oracle gateway without doing anything else', async () => {
      kvStoreGatewayMock.getExchangeOracleRegistrationNeeded = jest.fn().mockResolvedValue(true)
      const command = {
        oracleAddress: '0x34df642',
        token: 'test-token',
      };
      await service.registerWorker(command);
      expect(
        reputationOracleGateway.sendWorkerRegistration,
      ).toHaveBeenCalledWith(command);
    });

    it('should throw an error when no registration is needed', async () => {
      kvStoreGatewayMock.getExchangeOracleRegistrationNeeded = jest.fn().mockResolvedValue(false)
      const command = {
        oracleAddress: '0x34df642',
        token: 'test-token',
      };
      await expect(
        service.registerWorker(command)
      ).rejects.toThrow(new Error('No registration needed'));
    });
  });
});
