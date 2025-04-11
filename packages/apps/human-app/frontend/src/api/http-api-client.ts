import { type ZodType } from 'zod';

export class ApiClientError extends Error {
  constructor(
    public readonly message: string,
    public readonly status: number,
    public readonly data: unknown
  ) {
    super(message);
  }
}

export interface RequestConfig {
  queryParams?: Record<string, unknown>;
  body?:
    | string
    | Record<string, unknown>
    | unknown[]
    | ArrayBuffer
    | Blob
    | File
    | FormData;
  headers?: Record<string, string | number | boolean | null>;
  abortSignal?: AbortSignal;
  successSchema?: ZodType;
  baseUrl?: string;
}

type HttpApiClientMethod = <T = unknown>(
  path: string,
  config?: Omit<RequestConfig, 'body'>
) => Promise<T>;

type HttpApiClientMethodWithBody = <T = unknown>(
  path: string,
  config: RequestConfig
) => Promise<T>;

export class HttpApiClient {
  constructor(protected baseUrl?: string) {}
  protected async makeRequest<T = unknown>(
    method: string,
    path: string,
    config: RequestConfig
  ): Promise<T> {
    const url = new URL(path, config.baseUrl ?? this.baseUrl);

    const { queryParams, body, headers, successSchema, abortSignal } = config;

    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: abortSignal,
    });

    const text = await response.text();

    const responseBody: unknown = text.length > 0 ? JSON.parse(text) : null;

    if (!response.ok) {
      const errorMessage = this.getErrorMessageForResponse(
        responseBody,
        response.statusText
      );

      throw new ApiClientError(errorMessage, response.status, responseBody);
    }

    if (successSchema) {
      try {
        successSchema.parse(responseBody);
      } catch (error) {
        throw new Error(`Error parsing response body: ${String(error)}`);
      }
    }

    return responseBody as T;
  }

  private getErrorMessageForResponse(
    responseBody: unknown,
    statusText: string
  ): string {
    if (typeof responseBody === 'string') {
      return responseBody;
    }

    if (typeof responseBody === 'object') {
      return (
        (responseBody as { message?: string }).message ??
        'Unknown request error.'
      );
    }

    if (statusText.length) {
      return statusText;
    }

    return 'Unknown request error.';
  }

  get: HttpApiClientMethod = async (path, config = {}) => {
    return this.makeRequest('GET', path, config);
  };
  post: HttpApiClientMethodWithBody = async (path, config = {}) => {
    return this.makeRequest('POST', path, config);
  };
  patch: HttpApiClientMethodWithBody = async (path, config = {}) => {
    return this.makeRequest('PATCH', path, config);
  };
  put: HttpApiClientMethodWithBody = async (path, config = {}) => {
    return this.makeRequest('PUT', path, config);
  };
  delete: HttpApiClientMethod = async (path, config = {}) => {
    return this.makeRequest('DELETE', path, config);
  };
}
