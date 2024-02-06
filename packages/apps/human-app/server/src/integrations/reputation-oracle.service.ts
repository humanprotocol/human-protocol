import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { SignupWorkerDto } from '../interfaces/signup-worker-request.dto';

@Injectable()
export class ReputationOracleService {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  async signupWorker(signupWorkerDto: SignupWorkerDto): Promise<void> {
    try {
      const method = 'POST';
      const baseUrl = this.configService.get<string>('REPUTATION_ORACLE_URL');
      const url = `${baseUrl}/auth/signup`;

      const headers = {
        'Content-Type': 'application/json',
      };

      const options = {
        method,
        url,
        headers,
        data: signupWorkerDto,
      };

      const response = await lastValueFrom(this.httpService.request(options));
      return response.data;
    } catch (error) {
      throw new HttpException(
        'Error occurred while redirecting request.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
