import { PasswordResetController } from '../password-reset.controller';
import { PasswordResetService } from '../password-reset.service';
import { Test, TestingModule } from '@nestjs/testing';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { PasswordResetProfile } from '../password-reset.mapper.profile';
import { serviceMock } from './password-reset.service.mock';
import { expect, it } from '@jest/globals';
import {
  ForgotPasswordCommand,
  ForgotPasswordDto,
} from '../model/forgot-password.model';
import {
  forgotPasswordDtoFixture,
  restorePasswordCommandFixture,
  restorePasswordDtoFixture,
} from './password-reset.fixtures';
import {
  RestorePasswordCommand,
  RestorePasswordDto,
} from '../model/restore-password.model';

describe('PasswordResetController', () => {
  let controller: PasswordResetController;
  let service: PasswordResetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PasswordResetController],
      imports: [
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      providers: [PasswordResetService, PasswordResetProfile],
    })
      .overrideProvider(PasswordResetService)
      .useValue(serviceMock)
      .compile();

    controller = module.get<PasswordResetController>(PasswordResetController);
    service = module.get<PasswordResetService>(PasswordResetService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('forgotPassword', () => {
    it('should call the processForgotPassword method of the service with the correct arguments', async () => {
      const dto: ForgotPasswordDto = forgotPasswordDtoFixture;
      const expectedCommand: ForgotPasswordCommand = {
        email: dto.email,
        hCaptchaToken: dto.h_captcha_token
      };
      await controller.forgotPassword(dto);
      expect(service.processForgotPassword).toHaveBeenCalledWith(
        expectedCommand,
      );
    });
  });
  describe('restorePassword', () => {
    it('should call the processRestorePassword method of the service with the correct arguments', async () => {
      const dto: RestorePasswordDto = restorePasswordDtoFixture;
      const expectedCommand: RestorePasswordCommand =
        restorePasswordCommandFixture;
      await controller.restorePassword(dto);
      expect(service.processRestorePassword).toHaveBeenCalledWith(
        expectedCommand,
      );
    });
  });
});
