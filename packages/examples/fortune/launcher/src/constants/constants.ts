import { EnvironmentsEnum } from "@multiversx/sdk-dapp/types";

export const HMT_ADDRESS = process.env.REACT_APP_HMT_ADDRESS || '0x444c45937D2202118a0FF9c48d491cef527b59dF';
export const ESCROW_FACTORY_ADDRESS = process.env.REACT_APP_ESCROW_FACTORY_ADDRESS || '0x3FF93a3847Cd1fa62DD9BcfE351C4b6BcCcF10cB';
export const REC_ORACLE_ADDRESS = process.env.REACT_APP_REC_ORACLE_ADDRESS || '0x61F9F0B31eacB420553da8BCC59DC617279731Ac';
export const REP_ORACLE_ADDRESS = process.env.REACT_APP_REP_ORACLE_ADDRESS || '0xD979105297fB0eee83F7433fC09279cb5B94fFC6';
export const EXCHANGE_ORACLE_ADDRESS = process.env.REACT_APP_EXCHANGE_ORACLE_ADDRESS || '0x6b7E3C31F34cF38d1DFC1D9A8A59482028395809';

// Generate your own WalletConnect 2 ProjectId here: https://cloud.walletconnect.com/app
export const walletConnectV2ProjectId = '9b1a9564f91cb659ffe21b73d5c4e2d8';
export const TOOLS_API_URL = 'https://tools.multiversx.com';
export const sampleAuthenticatedDomains = [TOOLS_API_URL];

export const proxyNetwork = process.env.REACT_APP_MX_PROXY_NETWORK || 'https://devnet-gateway.multiversx.com';
export const apiTimeout = 6000;
export const gasLimit = 10000000;

export const REC_ORACLE_ADDRESS_MX = process.env.REACT_APP_REC_ORACLE_MX_ADDRESS || 'erd1w73dll00g2q96rqvj7gms00uey5s94z9fqjjj9ecgx2tpeyh8hxqpzgryr';
export const REP_ORACLE_ADDRESS_MX = process.env.REACT_APP_REP_ORACLE_MX_ADDRESS || 'erd17rw0ugxew767mwluxwu75gqg3m500qu7ktxfufn8tsf5dxxh6dds3nyt8w';
export const ESCROW_FACTORY_MX_ADDRESS = process.env.REACT_APP_ESCROW_FACTORY_MX_ADDRESS || 'erd17rw0ugxew767mwluxwu75gqg3m500qu7ktxfufn8tsf5dxxh6dds3nyt8w';

export const HMT_TOKEN = process.env.REACT_APP_HMT_MX_TOKEN || 'HMT';
export const HMT_DECIMALS = Number(process.env.REACT_APP_HTM_MX_DECIMALS) || 4;

let _mx_env = process.env.REACT_APP_MX_ENVIRONMENT || 'devnet';
export const MX_ENVIRONMENT = _mx_env === 'mainnet' ? EnvironmentsEnum.mainnet : _mx_env === 'testnet' ? EnvironmentsEnum.testnet : EnvironmentsEnum.devnet;