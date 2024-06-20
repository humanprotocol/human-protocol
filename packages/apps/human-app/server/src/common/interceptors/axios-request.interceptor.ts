import axios from 'axios';
import { Injectable, Logger } from '@nestjs/common';
import { EnvironmentConfigService } from '../config/environment-config.service';

@Injectable()
export class AxiosRequestInterceptor {
  private readonly logger = new Logger(AxiosRequestInterceptor.name);

  constructor(private configService: EnvironmentConfigService) {
    this.initializeRequestInterceptor();
  }

  private initializeRequestInterceptor() {
    if (!this.configService.axiosRequestLoggingEnabled) return;
    axios.interceptors.request.use(
      (config) => {
        const { url, method, params, data, headers } = config;
        this.logger.log('NEW REQUEST:');
        this.logger.log(`Request URL: ${url}`);
        this.logger.log(`Method: ${method}`);
        this.logger.log(`Params: ${JSON.stringify(params ?? {})}`);
        this.logger.log(`Body: ${JSON.stringify(data ?? {})}`);
        this.logger.log(`Headers: ${JSON.stringify(headers ?? {})}`);
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
