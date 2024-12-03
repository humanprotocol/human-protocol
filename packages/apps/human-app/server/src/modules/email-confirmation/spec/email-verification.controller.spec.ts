import { EmailConfirmationController } from '../email-confirmation.controller';
import { EmailConfirmationService } from '../email-confirmation.service';
import { Test, TestingModule } from '@nestjs/testing';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { EmailConfirmationProfile } from '../email-confirmation.mapper.profile';
import { serviceMock } from './email-verification.service.mock';
import { expect, it } from '@jest/globals';
import {
  EmailVerificationCommand,
  EmailVerificationDto,
} from '../model/email-verification.model';
import {
  emailVerificationToken,
  resendEmailVerificationCommandFixture,
  resendEmailVerificationDtoFixture,
  emailVerificationCommandFixture,
  emailVerificationDtoFixture,
} from './email-verification.fixtures';

describe('EmailConfirmationController', () => {
  let controller: EmailConfirmationController;
  let service: EmailConfirmationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailConfirmationController],
      imports: [
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      providers: [EmailConfirmationService, EmailConfirmationProfile],
    })
      .overrideProvider(EmailConfirmationService)
      .useValue(serviceMock)
      .compile();

    controller = module.get<EmailConfirmationController>(
      EmailConfirmationController,
    );
    service = module.get<EmailConfirmationService>(EmailConfirmationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('verifyEmail', () => {
    it('should call the processEmailVerification method of the service with the correct arguments', async () => {
      const dto: EmailVerificationDto = emailVerificationDtoFixture;
      const expectedCommand: EmailVerificationCommand =
        emailVerificationCommandFixture;
      await controller.verifyEmail(dto);
      expect(service.processEmailVerification).toHaveBeenCalledWith(
        expectedCommand,
      );
    });
  });

  describe('resendEmailVerification', () => {
    it('should call the processResendEmailVerification method of the service with the correct arguments', async () => {
      const dto = resendEmailVerificationDtoFixture;
      const command = resendEmailVerificationCommandFixture;
      await controller.resendEmailVerification(dto, emailVerificationToken);
      expect(service.processResendEmailVerification).toHaveBeenCalledWith(
        command,
      );
    });
  });
});
