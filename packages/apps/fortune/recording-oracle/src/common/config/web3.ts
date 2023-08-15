import { ConfigType, registerAs } from '@nestjs/config';

export const web3Config = registerAs('web3', () => ({
  web3PrivateKey: process.env.WEB3_PRIVATE_KEY!,
}));

export const web3ConfigKey = web3Config.KEY;
export type Web3ConfigType = ConfigType<typeof web3Config>;
