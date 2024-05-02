import dotenv from 'dotenv';
import cron from 'node-cron';
import { ConfigService } from './config';
import { ChainId, Encryption } from '@human-protocol/sdk';
import { StorageService } from './storage';
import { HotWallet, RefillWallet } from './wallet';
import { TokenId, Web3Service } from './web3';
import path from 'path';

const envPath = path.resolve(
  __dirname,
  '../..',
  process.env.NODE_ENV ? `.env.${process.env.NODE_ENV as string}` : '.env',
);
dotenv.config({ path: envPath });

cron.schedule('*/15 * * * * *', async () => {
  try {
    console.log('Balancer started');

    const configService = new ConfigService();
    const storageService = new StorageService(
      await Encryption.build(configService.pgpPrivateKey),
      configService,
    );

    const web3Service = new Web3Service(configService);

    const hotWalletAddress = configService.web3HotWalletAddress;
    const refillWalletAddress = web3Service.signerAddress;
    const chainId = ChainId.POLYGON_AMOY;

    const hmtHotWallet = new HotWallet(
      chainId,
      web3Service,
      storageService,
      configService,
      hotWalletAddress,
      TokenId.HMT,
    );

    const hmtRefillWallet = new RefillWallet(
      chainId,
      web3Service,
      storageService,
      configService,
      refillWalletAddress,
      TokenId.HMT,
    );

    await hmtRefillWallet.refill(hmtHotWallet);

    const nativeHotWallet = new HotWallet(
      chainId,
      web3Service,
      storageService,
      configService,
      hotWalletAddress,
      TokenId.NATIVE,
    );

    const nativeRefillWallet = new RefillWallet(
      chainId,
      web3Service,
      storageService,
      configService,
      refillWalletAddress,
      TokenId.NATIVE,
    );

    await nativeRefillWallet.refill(nativeHotWallet);

    console.log('Balancer finished');
  } catch (e) {
    console.log(e);
  }
});
