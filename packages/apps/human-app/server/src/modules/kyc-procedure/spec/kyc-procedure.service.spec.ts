import { KycProcedureService } from '../kyc-procedure.service';
import { ReputationOracleGateway } from '../../../integrations/reputation-oracle/reputation-oracle.gateway';
import { Test, TestingModule } from '@nestjs/testing';
import { reputationOracleGatewayMock } from '../../../integrations/reputation-oracle/spec/reputation-oracle.gateway.mock';
import { expect, it, jest } from '@jest/globals';

describe('KycProcedureService', () => {
  let service: KycProcedureService;
  let reputationOracleGateway: ReputationOracleGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KycProcedureService, ReputationOracleGateway],
    })
      .overrideProvider(ReputationOracleGateway)
      .useValue(reputationOracleGatewayMock)
      .compile();

    service = module.get<KycProcedureService>(KycProcedureService);
    reputationOracleGateway = module.get<ReputationOracleGateway>(
      ReputationOracleGateway,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call sendKycProcedureStart method of reputationOracleGateway', async () => {
    const kycGatewaySpy = jest.spyOn(
      reputationOracleGateway,
      'sendKycProcedureStart',
    );
    await service.processStartKycProcedure('token');
    expect(kycGatewaySpy).toHaveBeenCalledWith('token');
  });
  it('should call reputation oracle gateway with jwt token', async () => {
    const kycGatewaySpy = jest.spyOn(
      reputationOracleGateway,
      'sendKycOnChain',
    );
    await service.processKycOnChain('token');
    expect(kycGatewaySpy).toHaveBeenCalledWith('token');
  });
});
