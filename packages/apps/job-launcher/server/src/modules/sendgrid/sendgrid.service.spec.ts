import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { SendGridService } from './sendgrid.service';
import { MailService } from '@sendgrid/mail';
import { ErrorSendGrid } from '../../common/constants/errors';
import {
  MOCK_SENDGRID_API_KEY,
  MOCK_SENDGRID_FROM_EMAIL,
  MOCK_SENDGRID_FROM_NAME,
} from '../../../test/constants';

describe('SendGridService', () => {
  let sendGridService: SendGridService;
  let mailService: MailService;
  let mockConfigService: Partial<ConfigService>;

  beforeAll(async () => {
    const mockMailService = {
      send: jest.fn(),
      setApiKey: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'SENDGRID_API_KEY':
            return MOCK_SENDGRID_API_KEY;
          case 'SENDGRID_FROM_EMAIL':
            return MOCK_SENDGRID_FROM_EMAIL;
          case 'SENDGRID_FROM_NAME':
            return MOCK_SENDGRID_FROM_NAME;
        }
      }),
    };

    const app = await Test.createTestingModule({
      providers: [
        SendGridService,
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();
    sendGridService = app.get<SendGridService>(SendGridService);
    mailService = app.get(MailService);
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
      ).rejects.toThrowError(ErrorSendGrid.EmailNotSent);
    });
  });

  describe('constructor', () => {
    it('should initialize SendGridService with valid API key', () => {
      sendGridService = new SendGridService(
        mailService,
        mockConfigService as any,
      );

      expect(mailService.setApiKey).toHaveBeenCalledWith(MOCK_SENDGRID_API_KEY);
      expect(sendGridService['defaultFromEmail']).toEqual(
        MOCK_SENDGRID_FROM_EMAIL,
      );
      expect(sendGridService['defaultFromName']).toEqual(
        MOCK_SENDGRID_FROM_NAME,
      );
    });

    it('should throw an error with invalid API key', async () => {
      const invalidApiKey = 'invalid-api-key';
      mockConfigService.get = jest.fn().mockReturnValue(invalidApiKey);

      expect(() => {
        sendGridService = new SendGridService(
          mailService,
          mockConfigService as any,
        );
      }).toThrowError(ErrorSendGrid.InvalidApiKey);
    });
  });
});
