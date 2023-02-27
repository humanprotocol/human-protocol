import { EnvironmentsEnum } from "@multiversx/sdk-dapp/types";

export const proxyNetwork = process.env.REACT_APP_MX_PROXY_NETWORK || 'https://devnet-gateway.multiversx.com';
export const apiNetwork = process.env.REACT_APP_MX_API_NETWORK || 'https://devnet-api.multiversx.com';
export const walletConnectV2ProjectId = '9b1a9564f91cb659ffe21b73d5c4e2d8';
export const TOOLS_API_URL = 'https://tools.multiversx.com';
export const sampleAuthenticatedDomains = [TOOLS_API_URL];
let _mx_env = process.env.REACT_APP_MX_ENVIRONMENT || 'devnet';
export const MX_ENVIRONMENT = _mx_env === 'mainnet' ? EnvironmentsEnum.mainnet : _mx_env === 'testnet' ? EnvironmentsEnum.testnet : EnvironmentsEnum.devnet;