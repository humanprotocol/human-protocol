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
  it('should send email', async () => {
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
    const service = app.get<SendGridService>(SendGridService);
    const sendgrid = app.get(MailService);
    const mock = jest
      .spyOn(sendgrid, 'send')
      .mockImplementationOnce(async () => {
        return [{} as any, {}];
      });
    await service.sendEmail({
      to: 'test@example.com',
      from: 'test@example.com',
      subject: 'Sending with SendGrid is Fun',
      text: 'and easy to do anywhere, even with Node.js',
      html: '<strong>and easy to do anywhere, even with Node.js</strong>',
    });
    expect(mock).toHaveBeenCalled();
  });

  it('should send email from default address', async () => {
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
    const service = app.get<SendGridService>(SendGridService);
    const sendgrid = app.get(MailService);
    const mock = jest
      .spyOn(sendgrid, 'send')
      .mockImplementationOnce(async () => {
        return [{} as any, {}];
      });
    await service.sendEmail({
      to: 'test@example.com',
      subject: 'Sending with SendGrid is Fun',
      text: 'and easy to do anywhere, even with Node.js',
      html: '<strong>and easy to do anywhere, even with Node.js</strong>',
    });

    expect(mock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'info@hmt.ai',
      }),
    );
  });
});
