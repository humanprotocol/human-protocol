import { Inject, Injectable } from '@nestjs/common';
import {
  ClientResponse,
  MailDataRequired,
  MailService,
  ResponseError,
} from '@sendgrid/mail';
import * as deepmerge from 'deepmerge';
import { SendGridConstants } from './sendgrid.constants';
import { SendGridModuleOptions } from './sendgrid.interfaces';
import { logger } from './sendgrid.logger';
import { ConfigService } from '@nestjs/config';
import { ConfigNames } from '../../common/config';

@Injectable()
export class SendGridService {
  constructor(
    @Inject(SendGridConstants.SENDGRID_MODULE_OPTIONS)
    private readonly options: SendGridModuleOptions,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {
    this.mailService.setApiKey(
      this.configService.get<string>(ConfigNames.SENDGRID_API_KEY) || '',
    );
    logger.log('Set API Key');

    if (
      options.substitutionWrappers &&
      options.substitutionWrappers.left &&
      options.substitutionWrappers.right
    ) {
      this.mailService.setSubstitutionWrappers(
        options.substitutionWrappers.left,
        options.substitutionWrappers.right,
      );
      logger.log('Set Substitution Wrappers');
    }
  }

  public async send(
    data: Partial<MailDataRequired> | Partial<MailDataRequired>[],
    isMultiple?: boolean,
    cb?: (
      err: Error | ResponseError,
      result: [ClientResponse, Record<string, undefined>],
    ) => void,
  ): Promise<[ClientResponse, Record<string, undefined>]> {
    if (Array.isArray(data)) {
      return this.mailService.send(
        data.map((d) => this.mergeWithDefaultMailData(d)) as MailDataRequired[],
        isMultiple,
        cb,
      );
    } else {
      return this.mailService.send(
        this.mergeWithDefaultMailData(data),
        isMultiple,
        cb,
      );
    }
  }

  public async sendMultiple(
    data: Partial<MailDataRequired>,
    cb?: (
      error: Error | ResponseError,
      result: [ClientResponse, Record<string, undefined>],
    ) => void,
  ): Promise<[ClientResponse, Record<string, undefined>]> {
    return this.mailService.sendMultiple(
      this.mergeWithDefaultMailData(data) as MailDataRequired,
      cb,
    );
  }

  private mergeWithDefaultMailData(
    data: Partial<MailDataRequired>,
  ): MailDataRequired {
    if (!this.options.defaultMailData) {
      return data as MailDataRequired;
    }
    return deepmerge(this.options.defaultMailData, data);
  }
}
