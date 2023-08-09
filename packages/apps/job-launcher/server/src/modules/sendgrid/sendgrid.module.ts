import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { ClassProvider, FactoryProvider } from '@nestjs/common/interfaces';
import { ConfigModule } from '@nestjs/config';
import { MailService } from '@sendgrid/mail';

import {
  SendGridModuleAsyncOptions,
  SendGridModuleOptions,
  SendGridModuleOptionsFactory,
} from './sendgrid.interfaces';
import { SendGridService } from './sendgrid.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [SendGridService],
  exports: [SendGridService],
})
export class SendGridModule {
  public static forRoot(options: SendGridModuleOptions): DynamicModule {
    return {
      module: SendGridModule,
      providers: [
        {
          provide: 'SENDGRID_MODULE_OPTIONS',
          useValue: options,
        },
        MailService,
      ],
    };
  }

  public static forRootAsync(
    options: SendGridModuleAsyncOptions,
  ): DynamicModule {
    const asyncProviders = this.createAsyncProviders(options);
    return {
      module: SendGridModule,
      imports: [...(options.imports || [])],
      providers: [...asyncProviders, MailService],
    };
  }

  private static createAsyncProviders(
    options: SendGridModuleAsyncOptions,
  ): Provider[] {
    if (options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
        inject: options.inject,
      } as ClassProvider,
    ];
  }

  private static createAsyncOptionsProvider(
    options: SendGridModuleAsyncOptions,
  ): FactoryProvider {
    if (options.useFactory) {
      return {
        provide: 'SENDGRID_MODULE_OPTIONS',
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
    return {
      provide: 'SENDGRID_MODULE_OPTIONS',
      useFactory: async (
        optionsFactory: SendGridModuleOptionsFactory,
      ): Promise<SendGridModuleOptions> =>
        await optionsFactory.createSendGridModuleOptions(),
      inject: options.useClass ? [options.useClass] : [],
    };
  }
}
