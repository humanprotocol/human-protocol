import * as util from 'util';
import {
  Logger as TypeOrmLogger,
  LoggerOptions as TypeOrmLoggerOptions,
} from 'typeorm';
import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';

@Injectable()
export class TypeOrmLoggerService implements TypeOrmLogger {
  private options: TypeOrmLoggerOptions = 'all';

  constructor(@Inject(Logger) private readonly loggerService: LoggerService) {}

  public setOptions(options: TypeOrmLoggerOptions = 'all'): void {
    this.options = options;
  }

  logQuery(query: string, parameters?: any[]): void {
    if (
      this.options === 'all' ||
      this.options === true ||
      (this.options instanceof Array && this.options.indexOf('query') !== -1)
    ) {
      this.loggerService.log(
        `query : ${query} ${this.stringifyParams(parameters)}`,
        'TypeOrm',
      );
    }
  }

  logQueryError(error: string, query: string, parameters?: any[]): void {
    if (
      this.options === 'all' ||
      this.options === true ||
      (this.options instanceof Array && this.options.indexOf('error') !== -1)
    ) {
      this.loggerService.log(
        `query failed: ${query} ${this.stringifyParams(parameters)}`,
        'TypeOrm',
      );
      this.loggerService.log(`error: ${error}`, 'TypeOrm');
    }
  }

  logQuerySlow(time: number, query: string, parameters?: any[]): void {
    this.loggerService.log(
      `query is slow: ${query} ${this.stringifyParams(parameters)}`,
      'TypeOrm',
    );
    this.loggerService.log(`execution time: ${time}`, 'TypeOrm');
  }

  logSchemaBuild(message: string): void {
    if (
      this.options === 'all' ||
      (this.options instanceof Array && this.options.indexOf('schema') !== -1)
    ) {
      this.loggerService.log(message, 'TypeOrm');
    }
  }

  logMigration(message: string): void {
    this.loggerService.log(message, 'TypeOrm');
  }

  log(level: 'log' | 'info' | 'warn', message: unknown): void {
    switch (level) {
      case 'log':
        if (
          this.options === 'all' ||
          (this.options instanceof Array && this.options.indexOf('log') !== -1)
        )
          this.loggerService.log(message, 'TypeOrm');
        break;
      case 'info':
        if (
          this.options === 'all' ||
          (this.options instanceof Array && this.options.indexOf('info') !== -1)
        )
          this.loggerService.log(message, 'TypeOrm');
        break;
      case 'warn':
        if (
          this.options === 'all' ||
          (this.options instanceof Array && this.options.indexOf('warn') !== -1)
        )
          this.loggerService.warn(message, 'TypeOrm');
        break;
    }
  }

  protected stringifyParams(parameters: any[] = []): string {
    return parameters.length
      ? ` -- PARAMETERS: ${util.inspect(parameters)}`
      : '';
  }
}
