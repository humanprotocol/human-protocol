import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
@Injectable()
export class CommonHttpUtilService {
  constructor(private httpService: HttpService) {}
  async callExternalHttpUtilRequest<T>(
    options: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await lastValueFrom(
        this.httpService.request(options),
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}
