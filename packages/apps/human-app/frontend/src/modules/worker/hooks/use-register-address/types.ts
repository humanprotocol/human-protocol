import type { ResponseError } from '@/shared/types/global.type';

export interface RegisterAddressCallbacks {
  onSuccess?: () => void | Promise<void>;
  onError?: (error: ResponseError) => void | Promise<void>;
}

export interface RegisterAddressParams {
  address: string;
  signature: string;
}

export interface RegisterAddressResponse {
  success: boolean;
}
