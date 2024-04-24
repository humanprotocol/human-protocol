import { DisableOperatorController } from '../disable-operator.controller';
import { DisableOperatorService } from '../disable-operator.service';
import { Test, TestingModule } from '@nestjs/testing';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { expect, it } from '@jest/globals';
import { DisableOperatorProfile } from '../disable-operator.mapper';
import {
  disableOperatorCommandFixture,
  disableOperatorDtoFixture,
  disableOperatorTokenFixture,
  prepareSignatureCommandFixture,
  prepareSignatureDtoFixture,
  prepareSignatureResponseFixture,
} from './disable-operator.fixtures';
import { serviceMock } from './disable-operator.service.mock';
import {
  PrepareSignatureCommand,
  PrepareSignatureResponse,
} from '../model/prepare-signature.model';

describe('DisableOperatorController', () => {
  let controller: DisableOperatorController;
  let service: DisableOperatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisableOperatorController],
      imports: [
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      providers: [DisableOperatorService, DisableOperatorProfile],
    })
      .overrideProvider(DisableOperatorService)
      .useValue(serviceMock)
      .compile();

    controller = module.get<DisableOperatorController>(
      DisableOperatorController,
    );
    service = module.get<DisableOperatorService>(DisableOperatorService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('prepareSignature', () => {
    it('should call the processPrepareSignature method of the service with the correct arguments', async () => {
      const dto = prepareSignatureDtoFixture;
      const command = prepareSignatureCommandFixture;
      await controller.prepareSignature(dto);
      expect(service.processPrepareSignature).toHaveBeenCalledWith(command);
    });
  });

  it('should return the proper response from processPrepareSignature', async () => {
    const command: PrepareSignatureCommand = prepareSignatureCommandFixture;
    const expectedResponse: PrepareSignatureResponse =
      prepareSignatureResponseFixture;

    const response = await service.processPrepareSignature(command);
    expect(response).toEqual(expectedResponse);
  });

  describe('disableOperator', () => {
    it('should call the processDisableOperator method of the service with the correct arguments', async () => {
      const dto = disableOperatorDtoFixture;
      const command = disableOperatorCommandFixture;
      await controller.disableOperator(dto, disableOperatorTokenFixture);
      expect(service.processDisableOperator).toHaveBeenCalledWith(command);
    });
  });
});
