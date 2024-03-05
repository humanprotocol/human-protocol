import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';

export async function callExternalHttpRequest<T>(
  options: AxiosRequestConfig,
): Promise<T> {
  try {
    const response: AxiosResponse<T> = await lastValueFrom(this.httpService.request(options)); // TODO: httpService injection
    return response.data;
  } catch (error) {
    throw error;
  }
}