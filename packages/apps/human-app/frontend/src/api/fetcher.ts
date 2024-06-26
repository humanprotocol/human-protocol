import merge from 'lodash/merge';
import type { ZodType, ZodTypeDef } from 'zod';
import type { ResponseError } from '@/shared/types/global.type';
import type { SignInSuccessResponse } from '@/api/servieces/worker/sign-in';
// eslint-disable-next-line import/no-cycle -- cause by refresh token retry
import { signInSuccessResponseSchema } from '@/api/servieces/worker/sign-in';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { browserAuthProvider } from '@/shared/helpers/browser-auth-provider';

const appendHeader = (
  fetcherOptionsWithDefaults: RequestInit | undefined,
  newHeaders: Record<string, string>
) => {
  const headers = new Headers(fetcherOptionsWithDefaults?.headers);

  for (const [key, value] of Object.entries(newHeaders)) {
    headers.set(key, value);
  }

  return {
    ...fetcherOptionsWithDefaults,
    headers,
  };
};

export class FetchError extends Error {
  status: number;
  data: unknown;

  constructor({
    message,
    data,
    status,
  }: {
    message: string;
    status: number;
    data: unknown;
  }) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export type FetcherOptionsWithValidation<SuccessInput, SuccessOutput> =
  Readonly<{
    options?: RequestInit;
    successSchema: ZodType<SuccessOutput, ZodTypeDef, SuccessInput>;
    skipValidation?: false | undefined;
    authenticated?: boolean;
    baseUrl?: string;
  }>;

export type FetcherOptionsWithoutValidation = Readonly<{
  options?: RequestInit;
  skipValidation: true;
  authenticated?: boolean;
  baseUrl?: string;
}>;

export type FetcherOptions<SuccessInput, SuccessOutput> =
  | FetcherOptionsWithValidation<SuccessInput, SuccessOutput>
  | FetcherOptionsWithoutValidation;

export type FetcherUrl = string | URL;

export function createFetcher(defaultFetcherConfig?: {
  options?: RequestInit | (() => RequestInit);
  baseUrl: FetcherUrl | (() => FetcherUrl);
}) {
  async function fetcher<SuccessInput, SuccessOutput>(
    url: string | URL,
    fetcherOptions: FetcherOptionsWithValidation<SuccessInput, SuccessOutput>
  ): Promise<SuccessOutput>;

  async function fetcher(
    url: FetcherUrl,
    fetcherOptions: FetcherOptionsWithoutValidation
  ): Promise<unknown>;

  async function fetcher<SuccessInput, SuccessOutput>(
    url: FetcherUrl,
    fetcherOptions: FetcherOptions<SuccessInput, SuccessOutput>
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents -- required unknown for correct type intellisense
  ): Promise<SuccessOutput | unknown> {
    let fetcherOptionsWithDefaults = defaultFetcherConfig?.options
      ? merge(
          {},
          (() => {
            const options = defaultFetcherConfig.options;
            if (options instanceof Function) return options();
            return options;
          })(),
          fetcherOptions.options
        )
      : fetcherOptions.options;

    if (fetcherOptions.authenticated) {
      fetcherOptionsWithDefaults = appendHeader(fetcherOptionsWithDefaults, {
        Authorization: `Bearer ${browserAuthProvider.getAccessToken()}`,
      });
    }

    const baseUrl = (() => {
      const currentUrl = fetcherOptions.baseUrl
        ? () => fetcherOptions.baseUrl
        : defaultFetcherConfig?.baseUrl;
      if (currentUrl instanceof Function) return currentUrl();
      return currentUrl;
    })();

    function fetchUrlToString(fetchUrl: string | URL): string;
    function fetchUrlToString(fetchUrl: undefined): undefined;
    function fetchUrlToString(
      fetchUrl: string | URL | undefined
    ): string | undefined;
    function fetchUrlToString(
      fetchUrl: string | URL | undefined
    ): string | undefined {
      if (!fetchUrl) return undefined;
      if (fetchUrl instanceof URL) return fetchUrl.href;
      return fetchUrl;
    }

    const fetcherUrl = (() => {
      const urlAsString = fetchUrlToString(baseUrl);
      if (!urlAsString) return url;
      const normalizedUrl = fetchUrlToString(url).replace(/\//, '');
      const normalizedBaseUrl = urlAsString.replace(/\/$/, '');

      return `${normalizedBaseUrl}/${normalizedUrl}`;
    })();

    let response: Response | undefined;

    response = await fetch(fetcherUrl, fetcherOptionsWithDefaults);

    if (
      !response.ok &&
      response.status === 401 &&
      fetcherOptions.authenticated
    ) {
      let refetchAccessTokenSuccess: SignInSuccessResponse | undefined;
      try {
        refetchAccessTokenSuccess = await apiClient(
          apiPaths.worker.obtainAccessToken.path,
          {
            successSchema: signInSuccessResponseSchema,
            options: {
              method: 'POST',
              body: JSON.stringify({
                // eslint-disable-next-line camelcase -- camel case defined by api
                refresh_token: browserAuthProvider.getRefreshToken(),
              }),
            },
          }
        );
        browserAuthProvider.signIn(
          refetchAccessTokenSuccess,
          browserAuthProvider.authType
        );
      } catch {
        browserAuthProvider.signOut(() => {
          window.location.reload();
        });
        return;
      }

      const newHeaders = appendHeader(fetcherOptionsWithDefaults, {
        Authorization: `Bearer ${refetchAccessTokenSuccess.access_token}`,
      });
      response = await fetch(fetcherUrl, newHeaders);

      if (!response.ok) {
        browserAuthProvider.signOut(() => {
          window.location.reload();
        });
        return;
      }
    }

    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      try {
        data = await response.text();
      } catch (error) {
        data = null;
      }
    }

    if (!response.ok) {
      throw new FetchError({
        status: response.status,
        message: response.statusText,
        data,
      });
    }

    if (fetcherOptions.skipValidation) {
      return data;
    }

    return fetcherOptions.successSchema.parse(data);
  }

  return fetcher;
}

export const isFetcherError = (error: ResponseError): error is FetchError =>
  error instanceof FetchError;
