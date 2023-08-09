import { Test } from '@nestjs/testing';
import { MailService } from '@sendgrid/mail';

import {
  SendGridModuleOptions,
  SendGridModuleOptionsFactory,
} from './sendgrid.interfaces';
import { SendGridModule } from './sendgrid.module';
import { SendGridService } from './sendgrid.service';

describe('SendGridModule', () => {
  describe('forRoot', () => {
    it('should return DynamicModule', () => {
      expect(SendGridModule.forRoot({})).toStrictEqual({
        module: SendGridModule,
        providers: [
          {
            provide: 'SENDGRID_MODULE_OPTIONS',
            useValue: {},
          },
          MailService,
        ],
      });
    });
  });
  describe('forRootAsync', () => {
    it('uses useFactory', () => {
      const dynamicModule = SendGridModule.forRootAsync({
        useFactory: () => ({}),
      });
      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.providers).toBeDefined();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(Object.keys(dynamicModule.providers![0])).toStrictEqual([
        'provide',
        'useFactory',
        'inject',
      ]);

      expect(dynamicModule).toMatchObject({
        imports: [],
        module: SendGridModule,
        providers: [
          {
            inject: [],
            provide: 'SENDGRID_MODULE_OPTIONS',
          },
          MailService,
        ],
      });
    });

    it('uses useClass', async () => {
      class TestFactory implements SendGridModuleOptionsFactory {
        createSendGridModuleOptions(): SendGridModuleOptions {
          return {};
        }
      }

      const dynamicModule = SendGridModule.forRootAsync({
        useClass: TestFactory,
      });
      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.providers).toBeDefined();
      expect(dynamicModule).toMatchObject({
        module: SendGridModule,
        imports: [],
        providers: [
          { provide: 'SENDGRID_MODULE_OPTIONS', inject: [TestFactory] },
          { provide: TestFactory, useClass: TestFactory },
          MailService,
        ],
      });

      await expect(
        Test.createTestingModule({
          imports: [dynamicModule],
        }).compile(),
      ).resolves.toBeDefined();
    });
  });

  if (process.env.NEST_SENDGRID_API_KEY) {
    describe('send email', () => {
      let sendgrid: SendGridService;

      beforeAll(async () => {
        const app = await Test.createTestingModule({
          imports: [
            SendGridModule.forRoot({
              defaultMailData: {
                from: process.env.NEST_SENDGRID_EMAIL,
                to: process.env.NEST_SENDGRID_EMAIL,
              },
            }),
          ],
        }).compile();

        sendgrid = app.get(SendGridService);
      });

      it('send', async () => {
        const [res] = await sendgrid.send({
          subject: '[Ignore] This email is test',
          html: '<strong>[Ignore] This email is test</strong>',
        });
        expect(res.statusCode).toEqual(202);
      });
      it('sendMultiple', async () => {
        const [res] = await sendgrid.sendMultiple({
          subject: '[Ignore] This email is test',
          html: '<strong>[Ignore] This email is test</strong>',
        });
        expect(res.statusCode).toEqual(202);
      });
    });
  }
});
