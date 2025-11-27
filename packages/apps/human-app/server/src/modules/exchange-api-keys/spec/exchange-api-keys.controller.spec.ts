import { classes } from '@automapper/classes';
import { AutomapperModule } from '@automapper/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import { RequestWithUser } from '../../../common/interfaces/jwt';
import { ExchangeApiKeysController } from '../exchange-api-keys.controller';
import { ExchangeApiKeysService } from '../exchange-api-keys.service';
import {
  enrollExchangeApiKeysCommandFixture,
  enrollExchangeApiKeysDtoFixture,
  enrollExchangeApiKeysResponseFixture,
  EXCHANGE_NAME,
  retrieveExchangeApiKeysResponseFixture,
  TOKEN,
} from './exchange-api-keys.fixtures';
import { exchangeApiKeysServiceMock } from './exchange-api-keys.service.mock';
import { ExchangeApiKeysProfile } from '../exchange-api-keys.mapper.profile';

describe('ExchangeApiKeysController', () => {
  let controller: ExchangeApiKeysController;
  let service: ExchangeApiKeysService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExchangeApiKeysController],
      imports: [
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      providers: [
        ExchangeApiKeysService,
        ExchangeApiKeysProfile,
        {
          provide: ExchangeApiKeysService,
          useValue: exchangeApiKeysServiceMock,
        },
      ],
    })
      .overrideProvider(ExchangeApiKeysService)
      .useValue(exchangeApiKeysServiceMock)
      .compile();

    controller = module.get<ExchangeApiKeysController>(
      ExchangeApiKeysController,
    );
    service = module.get<ExchangeApiKeysService>(ExchangeApiKeysService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('enroll', () => {
    it('should call service.enroll with mapped command and return id', async () => {
      const req: RequestWithUser = { token: TOKEN } as RequestWithUser;
      const result = await controller.enroll(
        EXCHANGE_NAME,
        enrollExchangeApiKeysDtoFixture,
        req,
      );
      expect(service.enroll).toHaveBeenCalledWith(
        enrollExchangeApiKeysCommandFixture,
      );
      expect(result).toEqual(enrollExchangeApiKeysResponseFixture);
    });
  });

  describe('delete', () => {
    it('should call service.delete with token', async () => {
      const req: RequestWithUser = { token: TOKEN } as RequestWithUser;
      const result = await controller.delete(req);
      expect(service.delete).toHaveBeenCalledWith(TOKEN);
      expect(result).toEqual(undefined);
    });
  });

  describe('retrieve', () => {
    it('should call service.retrieve with token and return response', async () => {
      const req: RequestWithUser = { token: TOKEN } as RequestWithUser;
      const result = await controller.retrieve(req);
      expect(service.retrieve).toHaveBeenCalledWith(TOKEN);
      expect(result).toEqual(retrieveExchangeApiKeysResponseFixture);
    });
  });
});
