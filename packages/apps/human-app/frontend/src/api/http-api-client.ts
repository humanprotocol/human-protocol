import { ZodError, type ZodType } from 'zod';
import { env } from '@/shared/env';

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
    const url = new URL(path, this.baseUrl);

    const { queryParams, body, headers, successSchema, abortSignal } = config;

    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (!value) return;

        if (Array.isArray(value)) {
          value
            .filter((i) => i !== undefined)
            .forEach((item) => {
              url.searchParams.append(key, String(item));
            });
          return;
        }

        url.searchParams.append(key, String(value));
      });
    }

    const lowercasedHeaders = Object.fromEntries(
      Object.entries(headers ?? {}).map(([k, v]) => [k.toLowerCase(), v])
    );

    const response = await fetch(url, {
      method,
      headers: {
        'content-type': 'application/json',
        ...lowercasedHeaders,
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
        // Zod defaulty type is any, but parsing will return the correct type
        return successSchema.parse(responseBody) as T;
      } catch (error) {
        if (error instanceof ZodError) {
          // eslint-disable-next-line no-console
          console.error('Response parsing error: ', error.issues);
          throw new Error('Response schema validation error.');
        }

        // eslint-disable-next-line no-console
        console.error('Unexpected error while parsing response body: ', error);
        throw new Error(`Error parsing response body.`);
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

    if (typeof responseBody === 'object' && responseBody !== null) {
      if ('message' in responseBody) {
        if (Array.isArray(responseBody.message)) {
          return responseBody.message.join(', ');
        }

        if (typeof responseBody.message === 'string') {
          return responseBody.message;
        }
      }

      return 'Unknown request error.';
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

export const humanAppApiClient = new HttpApiClient(env.VITE_API_URL);
