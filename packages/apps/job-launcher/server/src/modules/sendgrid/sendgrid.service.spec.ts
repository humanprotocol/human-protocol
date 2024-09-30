import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { SendGridService } from './sendgrid.service';
import { MailService } from '@sendgrid/mail';
import { ErrorSendGrid } from '../../common/constants/errors';
import {
  MOCK_SENDGRID_API_KEY,
  MOCK_SENDGRID_FROM_EMAIL,
  MOCK_SENDGRID_FROM_NAME,
  mockConfig,
} from '../../../test/constants';
import { SendgridConfigService } from '../../common/config/sendgrid-config.service';
import { ControlledError } from '../../common/errors/controlled';
import { HttpStatus } from '@nestjs/common';

describe('SendGridService', () => {
  let sendGridService: SendGridService;
  let mailService: MailService;
  let configService: ConfigService;

  beforeAll(async () => {
    const mockMailService = {
      send: jest.fn(),
      setApiKey: jest.fn(),
    };

    const app = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfig[key]),
            getOrThrow: jest.fn((key: string) => {
              if (!mockConfig[key]) {
                throw new Error(`Configuration key "${key}" does not exist`);
              }
              return mockConfig[key];
            }),
          },
        },
        SendGridService,
        SendgridConfigService,
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();
    sendGridService = app.get<SendGridService>(SendGridService);
    mailService = app.get(MailService);
    configService = app.get<ConfigService>(ConfigService);
  });

  describe('sendEmail', () => {
    it('should send email', async () => {
      const mock = jest
        .spyOn(mailService, 'send')
        .mockImplementationOnce(async () => {
          return [{} as any, {}];
        });
      await sendGridService.sendEmail({
        to: 'test@example.com',
        from: 'test@example.com',
        subject: 'Sending with SendGrid is Fun',
        text: 'and easy to do anywhere, even with Node.js',
        html: '<strong>and easy to do anywhere, even with Node.js</strong>',
      });
      expect(mock).toHaveBeenCalled();
    });

    it('should send email from default address', async () => {
      const mock = jest
        .spyOn(mailService, 'send')
        .mockImplementationOnce(async () => {
          return [{} as any, {}];
        });
      await sendGridService.sendEmail({
        to: 'test@example.com',
        subject: 'Sending with SendGrid is Fun',
        text: 'and easy to do anywhere, even with Node.js',
        html: '<strong>and easy to do anywhere, even with Node.js</strong>',
      });

      expect(mock).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.objectContaining({
            email: 'info@hmt.ai',
          }),
        }),
      );
    });

    it("should throw error if email wasn't sent", async () => {
      jest.spyOn(mailService, 'send').mockImplementationOnce(async () => {
        throw new Error(ErrorSendGrid.EmailNotSent);
      });

      await expect(
        sendGridService.sendEmail({
          to: 'test@example.com',
          subject: 'Sending with SendGrid is Fun',
          text: 'and easy to do anywhere, even with Node.js',
          html: '<strong>and easy to do anywhere, even with Node.js</strong>',
        }),
      ).rejects.toThrow(
        new ControlledError(ErrorSendGrid.EmailNotSent, HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('constructor', () => {
    it('should initialize SendGridService with valid API key', () => {
      expect(mailService.setApiKey).toHaveBeenCalledWith(MOCK_SENDGRID_API_KEY);
      expect(sendGridService['defaultFromEmail']).toEqual(
        MOCK_SENDGRID_FROM_EMAIL,
      );
      expect(sendGridService['defaultFromName']).toEqual(
        MOCK_SENDGRID_FROM_NAME,
      );
    });

    it('should throw an error with invalid API key', async () => {
      jest
        .spyOn(configService, 'getOrThrow')
        .mockImplementation((key: string) => {
          if (key === 'SENDGRID_API_KEY') return 'invalid-api-key';
          return mockConfig[key];
        });

      expect(() => {
        sendGridService = new SendGridService(
          mailService,
          configService as any,
        );
      }).toThrow(
        new ControlledError(ErrorSendGrid.InvalidApiKey, HttpStatus.CONFLICT),
      );
    });
  });
});
