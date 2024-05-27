import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { SendGridService } from './sendgrid.service';
import { MailService } from '@sendgrid/mail';
import { ErrorSendGrid } from '../../common/constants/errors';
import { MOCK_SENDGRID_API_KEY } from '../../../test/constants';
import { SendgridConfigService } from '../../common/config/sendgrid-config.service';
import { ControlledError } from '../../common/errors/controlled';
import { HttpStatus } from '@nestjs/common';

describe('SendGridService', () => {
  let sendGridService: SendGridService;
  let mailService: MailService;
  let sendgridConfigService: SendgridConfigService;

  jest
    .spyOn(SendgridConfigService.prototype, 'apiKey', 'get')
    .mockReturnValue(MOCK_SENDGRID_API_KEY);

  beforeAll(async () => {
    const mockMailService = {
      send: jest.fn(),
      setApiKey: jest.fn(),
    };

    const app = await Test.createTestingModule({
      providers: [
        SendGridService,
        {
          provide: MailService,
          useValue: mockMailService,
        },
        ConfigService,
        SendgridConfigService,
      ],
    }).compile();
    sendGridService = app.get<SendGridService>(SendGridService);
    mailService = app.get(MailService);
    sendgridConfigService = app.get(SendgridConfigService);
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
            email: 'app@humanprotocol.org',
          }),
        }),
      );
    });

    it("should throw error if email wasn't sent", async () => {
      jest.spyOn(mailService, 'send').mockImplementationOnce(async () => {
        throw new ControlledError(
          ErrorSendGrid.EmailNotSent,
          HttpStatus.BAD_REQUEST,
        );
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
      sendGridService = new SendGridService(mailService, sendgridConfigService);

      expect(mailService.setApiKey).toHaveBeenCalledWith(MOCK_SENDGRID_API_KEY);
    });

    it('should throw an error with invalid API key', async () => {
      const invalidApiKey = 'invalid-api-key';
      jest
        .spyOn(sendgridConfigService, 'apiKey', 'get')
        .mockReturnValue(invalidApiKey);

      expect(() => {
        sendGridService = new SendGridService(
          mailService,
          sendgridConfigService,
        );
      }).toThrowError(ErrorSendGrid.InvalidApiKey);
    });
  });
});
