import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { MailService } from '@sendgrid/mail';
import { SendGridModuleOptions } from './sendgrid.interfaces';
import { SendGridService } from './sendgrid.service';

const mockConfigService: Partial<ConfigService> = {
  get: jest.fn((key: string) => {
    switch (key) {
      case 'SENDGRID_API_KEY':
        return 'SG.xxxx';
    }
  }),
};

describe('SendGridService', () => {
  it('should be compile', async () => {
    await expect(
      Test.createTestingModule({
        providers: [
          SendGridService,
          {
            provide: 'SENDGRID_MODULE_OPTIONS',
            useValue: {} as SendGridModuleOptions,
          },
          MailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile(),
    ).resolves.toBeDefined();
  });

  it('should be compile, but print error log', async () => {
    await expect(
      Test.createTestingModule({
        providers: [
          SendGridService,
          {
            provide: 'SENDGRID_MODULE_OPTIONS',
            useValue: {} as SendGridModuleOptions,
          },
          MailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile(),
    ).resolves.toBeDefined();
  });

  it('should set Substitution Wrappers', async () => {
    await expect(
      Test.createTestingModule({
        providers: [
          SendGridService,
          {
            provide: 'SENDGRID_MODULE_OPTIONS',
            useValue: {
              substitutionWrappers: {
                left: 'left',
                right: 'right',
              },
            } as SendGridModuleOptions,
          },
          MailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile(),
    ).resolves.toBeDefined();
  });

  it('should send email', async () => {
    const app = await Test.createTestingModule({
      providers: [
        SendGridService,
        {
          provide: 'SENDGRID_MODULE_OPTIONS',
          useValue: {} as SendGridModuleOptions,
        },
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
    await service.send({
      to: 'test@example.com',
      from: 'test@example.com',
      subject: 'Sending with SendGrid is Fun',
      text: 'and easy to do anywhere, even with Node.js',
      html: '<strong>and easy to do anywhere, even with Node.js</strong>',
    });
    expect(mock).toHaveBeenCalled();
  });

  it('should set default data', async () => {
    const app = await Test.createTestingModule({
      providers: [
        SendGridService,
        {
          provide: 'SENDGRID_MODULE_OPTIONS',
          useValue: {
            defaultMailData: {
              from: 'test@example.com',
            },
          } as SendGridModuleOptions,
        },
        MailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();
    const service = app.get<SendGridService>(SendGridService);
    const sendgrid = app.get(MailService);
    let mock = jest
      .spyOn(sendgrid, 'send')
      .mockImplementationOnce(async (data) => {
        expect(data).toStrictEqual({
          to: 'test@example.com',
          from: 'test@example.com',
          subject: 'Sending with SendGrid is Fun',
          text: 'and easy to do anywhere, even with Node.js',
          html: '<strong>and easy to do anywhere, even with Node.js</strong>',
        });
        return [{} as any, {}];
      });
    await service.send({
      to: 'test@example.com',
      subject: 'Sending with SendGrid is Fun',
      text: 'and easy to do anywhere, even with Node.js',
      html: '<strong>and easy to do anywhere, even with Node.js</strong>',
    });
    expect(mock).toHaveBeenCalled();

    mock = jest.spyOn(sendgrid, 'send').mockImplementationOnce(async (data) => {
      expect(data).toStrictEqual([
        {
          to: 'test@example.com',
          from: 'test@example.com',
          subject: 'Sending with SendGrid is Fun',
          text: 'and easy to do anywhere, even with Node.js',
          html: '<strong>and easy to do anywhere, even with Node.js</strong>',
        },
        {
          to: 'test@example.com',
          from: 'test@example.com',
          subject: 'Sending with SendGrid is Fun',
          text: 'and easy to do anywhere, even with Node.js',
          html: '<strong>and easy to do anywhere, even with Node.js</strong>',
        },
      ]);
      return [{} as any, {}];
    });
    await service.send([
      {
        to: 'test@example.com',
        subject: 'Sending with SendGrid is Fun',
        text: 'and easy to do anywhere, even with Node.js',
        html: '<strong>and easy to do anywhere, even with Node.js</strong>',
      },
      {
        to: 'test@example.com',
        subject: 'Sending with SendGrid is Fun',
        text: 'and easy to do anywhere, even with Node.js',
        html: '<strong>and easy to do anywhere, even with Node.js</strong>',
      },
    ]);
    expect(mock).toHaveBeenCalled();
  });

  it('should send multiple', async () => {
    const app = await Test.createTestingModule({
      providers: [
        SendGridService,
        {
          provide: 'SENDGRID_MODULE_OPTIONS',
          useValue: {} as SendGridModuleOptions,
        },
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
      .spyOn(sendgrid, 'sendMultiple')
      .mockImplementationOnce(async () => {
        return [{} as any, {}];
      });
    await service.sendMultiple({
      to: 'test@example.com',
      from: 'test@example.com',
      subject: 'Sending with SendGrid is Fun',
      text: 'and easy to do anywhere, even with Node.js',
      html: '<strong>and easy to do anywhere, even with Node.js</strong>',
    });
    expect(mock).toHaveBeenCalled();
  });
});
