export type SiteverifyQueryParams = {
  sitekey: string;
  secret: string;
  response: string;
  remoteip?: string;
};

export type SiteverifyResponse = {
  success?: boolean;
  'error-codes'?: string[];
};

export type RegisterLabelerData = {
  email: string;
  evmAddress: string;
  country: string | null;
  ip?: string;
};

type LabelingDefaultQueryParams = {
  api_key: string;
};

export type RegisterLabelerQueryParams = LabelingDefaultQueryParams & {
  remoteip?: string;
};

export type RegisterLabelerBody = {
  email: string;
  eth_addr: string;
  language: string;
  country: string | null;
};

export type GetLabelerQueryParams = LabelingDefaultQueryParams & {
  email: string;
};

export type LabelerData = {
  sitekeys: Array<{
    sitekey: string;
  }>;
};
