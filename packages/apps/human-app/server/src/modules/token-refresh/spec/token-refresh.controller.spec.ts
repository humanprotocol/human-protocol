import { TokenRefreshController } from '../token-refresh.controller';
import { TokenRefreshService } from '../token-refresh.service';
import { Test, TestingModule } from '@nestjs/testing';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { TokenRefreshProfile } from '../token-refresh.mapper.profile';
import { tokenRefreshServiceMock } from './token-refresh.service.mock';
import { TokenRefreshDto } from '../model/token-refresh.model';

describe('RefreshTokenController', () => {
  let controller: TokenRefreshController;
  let service: TokenRefreshService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TokenRefreshController],
      imports: [
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      providers: [TokenRefreshService, TokenRefreshProfile],
    })
      .overrideProvider(TokenRefreshService)
      .useValue(tokenRefreshServiceMock)
      .compile();

    controller = module.get<TokenRefreshController>(TokenRefreshController);
    service = module.get<TokenRefreshService>(TokenRefreshService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('refresh token', () => {
    it('should service a refresh token method with proper fields set', async () => {
      const dto: TokenRefreshDto = {
        refresh_token: 'token',
      };
      await controller.refreshToken(dto);
      const expectedCommand = {
        refreshToken: dto.refresh_token,
      };
      expect(service.refreshToken).toHaveBeenCalledWith(expectedCommand);
    });
  });
});
