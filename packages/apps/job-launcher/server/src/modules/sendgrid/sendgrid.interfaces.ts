import { Type } from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common/interfaces';
import { MailDataRequired } from '@sendgrid/mail';

export interface SendGridModuleOptions {
  /**
   * You can set default data
   */
  defaultMailData?: Partial<MailDataRequired>;
  substitutionWrappers?: { left: string; right: string };
}

export type SendGridModuleAsyncOptions = {
  useClass?: Type<SendGridModuleOptionsFactory>;
  /**
   * The factory which should be used to provide the SendGrid options
   */
  useFactory?: (
    ...args: any[]
  ) => Promise<SendGridModuleOptions> | SendGridModuleOptions;
  /**
   * The providers which should get injected
   */
  inject?: any[];
} & Pick<ModuleMetadata, 'imports'>;

export interface SendGridModuleOptionsFactory {
  createSendGridModuleOptions():
    | Promise<SendGridModuleOptions>
    | SendGridModuleOptions;
}
