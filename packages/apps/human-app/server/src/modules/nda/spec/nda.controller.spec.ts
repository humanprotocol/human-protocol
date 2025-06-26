import { classes } from '@automapper/classes';
import { AutomapperModule } from '@automapper/nestjs';
import { Test, TestingModule } from '@nestjs/testing';

import { RequestWithUser } from '../../../common/interfaces/jwt';
import { NDAController } from '../nda.controller';
import { SignNDAProfile } from '../nda.mapper.profile';
import { NDAService } from '../nda.service';
import {
  NDA_TOKEN,
  signNDACommandFixture,
  signNDADtoFixture,
} from './nda.fixtures';
import { ndaServiceMock } from './nda.service.mock';

describe('NDAController', () => {
  let controller: NDAController;

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
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('nda', () => {
    it('should call service signNDA method with proper fields set', async () => {
      const dto = signNDADtoFixture;
      const command = signNDACommandFixture;
      await controller.signNDA(dto, { token: NDA_TOKEN } as RequestWithUser);
      expect(ndaServiceMock.signNDA).toHaveBeenCalledWith(command);
    });

    it('should call service getLatestNDA method with proper fields set', async () => {
      const token = NDA_TOKEN;
      await controller.getLatestNDA({ token: NDA_TOKEN } as RequestWithUser);
      expect(ndaServiceMock.getLatestNDA).toHaveBeenCalledWith({ token });
    });
  });
});
