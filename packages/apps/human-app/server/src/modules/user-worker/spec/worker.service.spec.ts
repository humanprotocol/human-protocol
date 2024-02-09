import { Test, TestingModule } from '@nestjs/testing';
import { WorkerService } from '../worker.service';
import { ReputationOracleGateway } from '../../../integrations/reputation-oracle/reputation-oracle.gateway';
import { reputationOracleGatewayMock } from '../../../integrations/reputation-oracle/spec/reputation-oracle.gateway.mock';
import { UserType } from '../../../common/enums/user';

describe('WorkerService', () => {
  let service: WorkerService;
  let reputationOracleGateway: ReputationOracleGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkerService, ReputationOracleGateway],
    })
      .overrideProvider(ReputationOracleGateway)
      .useValue(reputationOracleGatewayMock)
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
      const command = {
        email: 'email@example.com',
        password: 'Pa55word!',
        type: UserType.WORKER,
      };
      await service.signupWorker(command);
      expect(reputationOracleGateway.sendWorkerSignup).toHaveBeenCalledWith(
        command,
      );
    });
  });
});
