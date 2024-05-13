/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * TODO: Remove eslint rule for explict any after the PR is merged
 * Known issue for web3 v4 unknown ABI
 * https://github.com/web3/web3.js/pull/6636
 */

import hmtAbi from '@human-protocol/core/abis/HMToken.json';
import { ChainId } from '@human-protocol/sdk';
import Web3 from 'web3';

import { FAUCET_NETWORKS } from '../constants/networks';
import {
  AnonymousParams,
  AnonymousPoW,
  TransactionParams,
} from '@skaleproject/pow-ethers';

export const getWeb3 = (rpcUrl: string): Web3 => {
  const web3 = new Web3(rpcUrl);
  const faucetAccount = web3.eth.accounts.privateKeyToAccount(
    `0x${process.env.PRIVATE_KEY}`
  );
  web3.eth.accounts.wallet.add(faucetAccount);
  web3.eth.defaultAccount = faucetAccount.address;
  return web3;
};

export const getFaucetBalance = async (
  web3: Web3,
  hmtAddress: string,
  faucetAddress?: string
) => {
  if (
    (await web3.eth.getChainId()).toString() === ChainId.SKALE.toString() &&
    faucetAddress
  )
    return await web3.eth.getBalance(faucetAddress);
  const HMT = new web3.eth.Contract(hmtAbi, hmtAddress);
  const balance = web3.utils.fromWei(
    await (HMT.methods.balanceOf as any)(web3.eth.defaultAccount).call(),
    'ether'
  );
  return balance;
};

export const sendFunds = async (
  web3: Web3,
  hmtAddress: string,
  toAddress: string,
  faucetAddress?: string
): Promise<string | undefined> => {
  const HMT = new web3.eth.Contract(hmtAbi, hmtAddress);
  let txHash = '';
  try {
    if (
      (await web3.eth.getChainId()).toString() === ChainId.SKALE.toString() &&
      faucetAddress
    ) {
      const skalePOW = new AnonymousPoW({
        rpcUrl: FAUCET_NETWORKS[ChainId.SKALE].rpcUrl,
      } as AnonymousParams);
      const txParams = {
        to: faucetAddress,
        data: '0x0c11dedd000000000000000000000000' + toAddress.slice(2),
      } as TransactionParams;
      const receipt = await (await skalePOW.send(txParams)).wait();
      txHash = receipt.transactionHash;
    } else {
      const gasNeeded = await (HMT.methods.transfer as any)(
        toAddress,
        Web3.utils.toWei(process.env.DAILY_LIMIT as string, 'ether')
      ).estimateGas({ from: web3.eth.defaultAccount });
      const gasPrice = await web3.eth.getGasPrice();
      const receipt = await (HMT.methods.transfer as any)(
        toAddress,
        Web3.utils.toWei(process.env.DAILY_LIMIT as string, 'ether')
      ).send({
        from: web3.eth.defaultAccount,
        gas: gasNeeded.toString(),
        gasPrice: gasPrice.toString(),
      });
      txHash = receipt.transactionHash;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return undefined;
  }

  return txHash;
};

export const checkFaucetBalance = async (
  web3: Web3,
  hmtAddress: string,
  faucetAddress?: string
) => {
  if (
    (await getFaucetBalance(web3, hmtAddress, faucetAddress)) <
    process.env.DAILY_LIMIT
  )
    return false;

  if (
    (await web3.eth.getChainId()).toString() === ChainId.SKALE.toString() &&
    faucetAddress
  )
    return true;

  const HMT = new web3.eth.Contract(hmtAbi, hmtAddress);
  const gasNeeded = await (HMT.methods.transfer as any)(
    web3.eth.defaultAccount,
    Web3.utils.toWei(process.env.DAILY_LIMIT as string, 'ether')
  ).estimateGas({ from: web3.eth.defaultAccount });
  const gasPrice = await web3.eth.getGasPrice();
  const balance = await web3.eth.getBalance(web3.eth.defaultAccount);

  if (balance < web3.utils.toBigInt(gasNeeded) * gasPrice) return false;

  return true;
};
