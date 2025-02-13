jest.mock('../../logger');

import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from '@sendgrid/mail';

import * as environmentUtils from '../../common/utils/environment';
import { SENDGRID_TEMPLATES, SERVICE_NAME } from './sendgrid.service';
import logger from '../../logger';
import { getTemplateId } from './sendgrid.service';
import { EmailAction } from './constants';
import { EmailConfigService } from '../../common/config/email-config.service';
import { SendgridEmailService } from './sendgrid.service';

const mockMailService = {
  setApiKey: jest.fn(),
  send: jest.fn(),
};

const mockEmailConfigService = {
  apiKey: `SG.${faker.string.alphanumeric(22)}.${faker.string.alphanumeric(43)}`,
  from: faker.internet.email(),
  fromName: faker.string.alpha(),
};

const spyOnIsDevelopmentEnv = jest
  .spyOn(environmentUtils, 'isDevelopmentEnv')
  .mockReturnValue(false);

describe('SendgridEmailService', () => {
  let service: SendgridEmailService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendgridEmailService,
        { provide: MailService, useValue: mockMailService },
        { provide: EmailConfigService, useValue: mockEmailConfigService },
      ],
    }).compile();

    service = module.get<SendgridEmailService>(SendgridEmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize and set API key in staging/production mode', () => {
      new SendgridEmailService(
        mockMailService as any,
        mockEmailConfigService as any,
      );
      expect(mockMailService.setApiKey).toHaveBeenCalledWith(
        mockEmailConfigService.apiKey,
      );
    });

    it('should throw an error for invalid API key in staging/production mode', () => {
      const invalidConfig = {
        ...mockEmailConfigService,
        apiKey: faker.string.alphanumeric(),
      };
      expect(
        () =>
          new SendgridEmailService(
            mockMailService as any,
            invalidConfig as any,
          ),
      ).toThrow('Invalid SendGrid API key');
    });
  });

  describe('sendEmail', () => {
    const to = faker.internet.email();
    const payload = { url: faker.internet.url() };

    it('should log email in development mode without sending', async () => {
      spyOnIsDevelopmentEnv.mockReturnValueOnce(true);

      await service.sendEmail(to, EmailAction.SIGNUP, payload);
      expect(logger.debug).toHaveBeenCalledWith(
        'Email sent (development mode):',
        {
          to,
          action: EmailAction.SIGNUP,
          payload,
        },
      );
      expect(mockMailService.send).not.toHaveBeenCalled();
    });

    it('should send email in staging/production mode', async () => {
      await service.sendEmail(to, EmailAction.SIGNUP, payload);

      expect(mockMailService.send).toHaveBeenCalledTimes(1);
      expect(mockMailService.send).toHaveBeenCalledWith({
        from: {
          email: mockEmailConfigService.from,
          name: mockEmailConfigService.fromName,
        },
        to,
        templateId: SENDGRID_TEMPLATES.signup,
        dynamicTemplateData: {
          service_name: SERVICE_NAME,
          ...payload,
        },
      });
    });

    it('should log and throw error if sending fails', async () => {
      const error = new Error('SendGrid error');
      mockMailService.send.mockRejectedValueOnce(error);

      await expect(
        service.sendEmail(to, EmailAction.SIGNUP, payload),
      ).rejects.toThrow('Failed to send email');
      expect(logger.error).toHaveBeenCalledWith('Failed to send email', {
        error,
        to,
        action: EmailAction.SIGNUP,
        payload,
      });
    });
  });

  describe('getTemplateId', () => {
    it('should return correct template id for SIGNUP', () => {
      expect(getTemplateId(EmailAction.SIGNUP)).toBe(SENDGRID_TEMPLATES.signup);
    });

    it('should return correct template id for RESET_PASSWORD', () => {
      expect(getTemplateId(EmailAction.RESET_PASSWORD)).toBe(
        SENDGRID_TEMPLATES.resetPassword,
      );
    });

    it('should return correct template id for PASSWORD_CHANGED', () => {
      expect(getTemplateId(EmailAction.PASSWORD_CHANGED)).toBe(
        SENDGRID_TEMPLATES.passwordChanged,
      );
    });
  });
});
