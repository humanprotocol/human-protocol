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
        this.logger.debug(
          `
---------------NEW REQUEST: -----------------------------------------------------------------------------
            Request URL: ${url} 
            Method: ${method}
            Params: ${JSON.stringify(params ?? {})}
            Body: ${JSON.stringify(data ?? {})}
            Headers: ${JSON.stringify(headers ?? {})}
---------------------------------------------------------------------------------------------------------
          `,
        );
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
