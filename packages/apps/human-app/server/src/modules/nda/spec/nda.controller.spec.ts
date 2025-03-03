import { Test, TestingModule } from '@nestjs/testing';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';

import { NDAController } from '../nda.controller';
import { NDAService } from '../nda.service';
import { ndaServiceMock } from './nda.service.mock';
import {
  NDA_TOKEN,
  signNDACommandFixture,
  signNDADtoFixture,
} from './nda.fixtures';
import { SignNDAProfile } from '../nda.mapper.profile';

describe('NDAController', () => {
  let controller: NDAController;
  let service: NDAService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NDAController],
      imports: [
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      providers: [NDAService, SignNDAProfile],
    })
      .overrideProvider(NDAService)
      .useValue(ndaServiceMock)
      .compile();

    controller = module.get<NDAController>(NDAController);
    service = module.get<NDAService>(NDAService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('nda', () => {
    it('should call service signNDA method with proper fields set', async () => {
      const dto = signNDADtoFixture;
      const command = signNDACommandFixture;
      await controller.signNDA(dto, NDA_TOKEN);
      expect(service.signNDA).toHaveBeenCalledWith(command);
    });

    it('should call service getLatestNDA method with proper fields set', async () => {
      const token = NDA_TOKEN;
      await controller.getLatestNDA(token);
      expect(service.getLatestNDA).toHaveBeenCalledWith({ token });
    });
  });
});
