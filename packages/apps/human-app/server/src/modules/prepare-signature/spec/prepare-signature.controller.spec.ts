import { Test, TestingModule } from '@nestjs/testing';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { expect, it } from '@jest/globals';
import {
  prepareSignatureCommandFixture,
  prepareSignatureDtoFixture,
  prepareSignatureResponseFixture,
} from './prepare-signature.fixtures';
import { serviceMock } from './prepare-signature.service.mock';
import { PrepareSignatureResponse } from '../model/prepare-signature.model';
import { PrepareSignatureController } from '../prepare-signature.controller';
import { PrepareSignatureService } from '../prepare-signature.service';
import { PrepareSignatureProfile } from '../prepare-signature.mapper';

describe('PrepareSignatureController', () => {
  let controller: PrepareSignatureController;
  let service: PrepareSignatureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrepareSignatureController],
      imports: [
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      providers: [PrepareSignatureService, PrepareSignatureProfile],
    })
      .overrideProvider(PrepareSignatureService)
      .useValue(serviceMock)
      .compile();

    controller = module.get<PrepareSignatureController>(
      PrepareSignatureController,
    );
    service = module.get<PrepareSignatureService>(PrepareSignatureService);
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

  it('should return the proper response from prepareSignature method in controller', async () => {
    const dto = prepareSignatureDtoFixture;
    const expectedResponse: PrepareSignatureResponse =
      prepareSignatureResponseFixture;
    const response = await controller.prepareSignature(dto);
    expect(response).toEqual(expectedResponse);
  });
});
