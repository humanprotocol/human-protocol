import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { IntegrationsMap } from '../common/config/integrations';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import {
  SignupWorkerCommand,
  SignupWorkerData,
} from '../modules/user-worker/interfaces/worker-registration.interface';

@Injectable()
export class ReputationOracleGateway {
  private integrationsMap: IntegrationsMap;
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {
    this.integrationsMap = new IntegrationsMap(this.configService);
  }

  async signupWorker(signupWorkerCommand: SignupWorkerCommand): Promise<void> {
    const signupWorkerData = this.mapper.map(
      signupWorkerCommand,
      SignupWorkerCommand,
      SignupWorkerData,
    );

    try {
      const method = 'POST';
      const baseUrl = this.integrationsMap.getMap().reputation_oracle.url;
      const url = `${baseUrl}/auth/signup`;

      const headers = {
        'Content-Type': 'application/json',
      };

      const options = {
        method,
        url,
        headers,
        data: signupWorkerData,
      };

      const response = await lastValueFrom(this.httpService.request(options));
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new HttpException(error.response.data, error.response.status);
      } else {
        throw new HttpException(
          'Error occurred while redirecting request.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
