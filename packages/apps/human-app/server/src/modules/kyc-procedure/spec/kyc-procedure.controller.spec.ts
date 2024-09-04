import { KycProcedureController } from '../kyc-procedure.controller';
import { KycProcedureService } from '../kyc-procedure.service';
import { Test, TestingModule } from '@nestjs/testing';
import { serviceMock } from './kyc-procedure.service.mock';
import { expect, it, jest } from '@jest/globals';

describe('KycProcedureController', () => {
  let controller: KycProcedureController;
  let service: KycProcedureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KycProcedureController],
      providers: [KycProcedureService],
    })
      .overrideProvider(KycProcedureService)
      .useValue(serviceMock)
      .compile();

    controller = module.get<KycProcedureController>(KycProcedureController);
    service = module.get<KycProcedureService>(KycProcedureService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call processStartKycProcedure method of KycProcedureService', async () => {
    const startKycProcedureSpy = jest.spyOn(
      service,
      'processStartKycProcedure',
    );
    await controller.startKycProcedure('token');
    expect(startKycProcedureSpy).toHaveBeenCalledWith('token');
  });
  it('should call processKycOnChain method of KycProcedureService', async () => {
    const kycService = jest.spyOn(service, 'processKycOnChain');
    await controller.onChainKyc('token');
    expect(kycService).toHaveBeenCalledWith('token');
  });
});
