import merge from 'lodash/merge';
import { ZodError, type ZodType, type ZodTypeDef } from 'zod';
import type { ResponseError } from '@/shared/types/global.type';
import { browserAuthProvider } from '@/shared/helpers/browser-auth-provider';
import { env } from '@/shared/env';
import { type SignInSuccessResponse } from '@/api/services/worker/sign-in/types';
import { fetchTokenRefresh } from './fetch-refresh-token';

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
    withAuthRetry?: boolean;
    baseUrl?: string;
  }>;

export type FetcherOptionsWithoutValidation = Readonly<{
  options?: RequestInit;
  skipValidation: true;
  authenticated?: boolean;
  withAuthRetry?: boolean;
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
  let refreshPromise: Promise<SignInSuccessResponse | undefined> | null = null;

  async function refreshToken(): Promise<
    { access_token: string; refresh_token: string } | null | undefined
  > {
    if (!refreshPromise) {
      refreshPromise = fetchTokenRefresh(env.VITE_API_URL);
    }

    const result = await refreshPromise;

    refreshPromise = null;

    return result;
  }

  async function fetcher<SuccessInput, SuccessOutput>(
    url: string | URL,
    fetcherOptions: FetcherOptionsWithValidation<SuccessInput, SuccessOutput>,
    abortSignal?: AbortSignal
  ): Promise<SuccessOutput>;

  async function fetcher(
    url: FetcherUrl,
    fetcherOptions: FetcherOptionsWithoutValidation,
    abortSignal?: AbortSignal
  ): Promise<unknown>;

  async function fetcher<SuccessInput, SuccessOutput>(
    url: FetcherUrl,
    fetcherOptions: FetcherOptions<SuccessInput, SuccessOutput>,
    abortSignal?: AbortSignal
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

    if (abortSignal) {
      fetcherOptionsWithDefaults = {
        ...fetcherOptionsWithDefaults,
        signal: abortSignal,
      };
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
      fetcherOptions.authenticated &&
      fetcherOptions.withAuthRetry
    ) {
      const refetchAccessTokenSuccess = await refreshToken();

      const newHeaders = appendHeader(fetcherOptionsWithDefaults, {
        Authorization: `Bearer ${refetchAccessTokenSuccess?.access_token}`,
      });
      response = await fetch(fetcherUrl, newHeaders);

      if (!response.ok) {
        browserAuthProvider.signOut({ triggerSignOutSubscriptions: true });
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

    try {
      return fetcherOptions.successSchema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        // eslint-disable-next-line no-console -- ...
        console.error('Invalid response');
        error.errors.forEach((e) => {
          // eslint-disable-next-line no-console -- ...
          console.error(e);
        });
      }
      throw error;
    }
  }

  return { fetcher, refreshToken };
}

export const isFetcherError = (error: ResponseError): error is FetchError =>
  error instanceof FetchError;
