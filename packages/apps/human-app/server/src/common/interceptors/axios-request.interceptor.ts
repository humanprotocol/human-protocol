import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as errorUtils from '../utils/error';
import logger from '../../logger';

// This interceptor injection is guarded via IS_AXIOS_REQUEST_LOGGING_ENABLED environment variable.
@Injectable()
export class AxiosRequestInterceptor {
  private readonly logger = logger.child({
    context: AxiosRequestInterceptor.name,
  });

  constructor() {
    this.initializeRequestInterceptor();
  }

  private initializeRequestInterceptor() {
    axios.interceptors.request.use(
      (config) => {
        const { url, method, params, data } = config;

        this.logger.debug('Outgoing request info', {
          url,
          method,
          params,
          data,
        });
        return config;
      },
      (error) => {
        this.logger.error('Request error', {
          error: errorUtils.formatError(error),
        });
        return Promise.reject(error);
      },
    );

    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        this.logger.error('Response error', {
          error: errorUtils.formatError(error),
        });
        return Promise.reject(error);
      },
    );
  }
}
