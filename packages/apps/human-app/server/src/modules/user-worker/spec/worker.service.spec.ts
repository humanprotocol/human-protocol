import { Test, TestingModule } from '@nestjs/testing';
import { WorkerService } from '../worker.service';
import { ReputationOracleGateway } from '../../../integrations/reputation-oracle/reputation-oracle.gateway';
import { reputationOracleGatewayMock } from '../../../integrations/reputation-oracle/spec/reputation-oracle.gateway.mock';
import { SignupWorkerCommand } from '../model/worker-registration.model';
import { ExchangeOracleGateway } from '../../../integrations/exchange-oracle/exchange-oracle.gateway';
import { exchangeOracleGatewayMock } from '../../../integrations/exchange-oracle/spec/exchange-oracle.gateway.mock';

describe('WorkerService', () => {
  let service: WorkerService;
  let reputationOracleGateway: ReputationOracleGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkerService,
        ReputationOracleGateway,
        ExchangeOracleGateway,
      ],
    })
      .overrideProvider(ReputationOracleGateway)
      .useValue(reputationOracleGatewayMock)
      .overrideProvider(ExchangeOracleGateway)
      .useValue(exchangeOracleGatewayMock)
      .compile();

    service = module.get<WorkerService>(WorkerService);
    reputationOracleGateway = module.get<ReputationOracleGateway>(
      ReputationOracleGateway,
    );
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
      const command = {
        oracleAddress: '0x34df642',
        token: 'test-token',
      };
      await service.registerWorker(command);
      expect(
        reputationOracleGateway.sendWorkerRegistration,
      ).toHaveBeenCalledWith(command);
    });
  });
});
