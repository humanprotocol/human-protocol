import axios from 'axios';
import { Injectable, Logger } from '@nestjs/common';
// This interceptor injection is guarded via IS_AXIOS_REQUEST_LOGGING_ENABLED environment variable.
@Injectable()
export class AxiosRequestInterceptor {
  private readonly logger = new Logger(AxiosRequestInterceptor.name);

  constructor() {
    this.initializeRequestInterceptor();
  }

  private initializeRequestInterceptor() {
    axios.interceptors.request.use(
      (config) => {
        const { url, method, params, data, headers } = config;
        const message = JSON.stringify(
          {
            request_url: url,
            method: method,
            params: params ?? {},
            body: data ?? {},
            headers: headers ?? {},
          },
          null,
          2,
        );
        this.logger.debug(`Outgoing request:\n${message}`);
        return config;
      },
      (error) => {
        this.logger.error(`Request error: ${error.message}`);
        return Promise.reject(error);
      },
    );

    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        this.logger.error(`Response error: ${error.message}`);
        return Promise.reject(error);
      },
    );
  }
}
