import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { UiConfigurationController } from './ui-configuration.controller';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';

process.env.CHAIN_IDS_ENABLED = '15,42';

describe('UiConfigurationController', () => {
  let controller: UiConfigurationController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env',
          isGlobal: true,
        }),
      ],
      providers: [EnvironmentConfigService],
      controllers: [UiConfigurationController],
    }).compile();

    controller = module.get<UiConfigurationController>(
      UiConfigurationController,
    );
  });

  it('should return proper config', async () => {
    const result = await controller.getConfig();
    expect(result.chainIdsEnabled).toEqual(['15', '42']);
  });
});
