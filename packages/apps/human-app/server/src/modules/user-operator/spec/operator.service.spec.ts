import { Test, TestingModule } from '@nestjs/testing';
import { OperatorService } from '../operator.service';
import { ReputationOracleGateway } from '../../../integrations/reputation-oracle/reputation-oracle.gateway';
import { UserType } from '../../../common/enums/user';
import { reputationOracleGatewayMock } from '../../../integrations/reputation-oracle/spec/reputation-oracle.gateway.mock';
import { SigninOperatorCommand } from '../model/operator-signin.model';

describe('OperatorService', () => {
  let service: OperatorService;
  let reputationOracleGateway: ReputationOracleGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OperatorService, ReputationOracleGateway],
    })
      .overrideProvider(ReputationOracleGateway)
      .useValue(reputationOracleGatewayMock)
      .compile();

    service = module.get<OperatorService>(OperatorService);
    reputationOracleGateway = module.get<ReputationOracleGateway>(
      ReputationOracleGateway,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signupOperator', () => {
    it('should call reputation oracle gateway without doing anything else', async () => {
      const command = {
        address: '0x35d5511213a21f478e3e3f6f7e9d5f0f0e75e7b3',
        signature: '0x49506f2b430af3e3e3f6f7e9d5f0f0e75e7b3',
        type: UserType.OPERATOR,
      };
      await service.signupOperator(command);
      expect(reputationOracleGateway.sendOperatorSignup).toHaveBeenCalledWith(
        command,
      );
    });
  });
  describe('signinOperator', () => {
    it('should call reputation oracle gateway without doing anything else', async () => {
      const command = {
        address: '0x35d5511213a21f478e3e3f6f7e9d5f0f0e75e7b3',
        signature: '0x49506f2b430af3e3e3f6f7e9d5f0f0e75e7b3',
      } as SigninOperatorCommand;
      await service.signinOperator(command);
      expect(reputationOracleGateway.sendOperatorSignin).toHaveBeenCalledWith(
        command,
      );
    });
  });
});
