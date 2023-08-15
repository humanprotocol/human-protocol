import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { SendGridService } from './sendgrid.service';
import { MailService } from '@sendgrid/mail';

const mockConfigService: Partial<ConfigService> = {
  get: jest.fn((key: string) => {
    switch (key) {
      case 'SENDGRID_API_KEY':
        return 'SG.xxxx';
      case 'SENDGRID_FROM_EMAIL':
        return 'info@hmt.ai';
    }
  }),
};

describe('SendGridService', () => {
  let sendGridService: SendGridService;
  let mailService: MailService;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        SendGridService,
        MailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();
    sendGridService = app.get<SendGridService>(SendGridService);
    mailService = app.get(MailService);
  });

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
      throw new Error('Error');
    });

    await expect(
      sendGridService.sendEmail({
        to: 'test@example.com',
        subject: 'Sending with SendGrid is Fun',
        text: 'and easy to do anywhere, even with Node.js',
        html: '<strong>and easy to do anywhere, even with Node.js</strong>',
      }),
    ).rejects.toThrowError('Error');
  });
});
