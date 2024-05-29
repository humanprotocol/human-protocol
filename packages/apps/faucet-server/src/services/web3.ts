/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * TODO: Remove eslint rule for explict any after the PR is merged
 * Known issue for web3 v4 unknown ABI
 * https://github.com/web3/web3.js/pull/6636
 */

import hmtAbi from '@human-protocol/core/abis/HMToken.json';
import Web3 from 'web3';

export const getWeb3 = (rpcUrl: string): Web3 => {
  const web3 = new Web3(rpcUrl);
  const faucetAccount = web3.eth.accounts.privateKeyToAccount(
    `0x${process.env.PRIVATE_KEY}`
  );
  web3.eth.accounts.wallet.add(faucetAccount);
  web3.eth.defaultAccount = faucetAccount.address;
  return web3;
};

export const getFaucetBalance = async (web3: Web3, hmtAddress: string) => {
  const balance = web3.utils.fromWei(
    await getHmtBalance(web3, hmtAddress),
    'ether'
  );
  return balance;
};

export const getHmtBalance = async (web3: Web3, hmtAddress: string) => {
  const HMT = new web3.eth.Contract(hmtAbi, hmtAddress);
  return (HMT.methods.balanceOf as any)(web3.eth.defaultAccount).call();
};

export const getNativeBalance = async (web3: Web3) => {
  return await web3.eth.getBalance(web3.eth.defaultAccount);
};

export const sendFunds = async (
  web3: Web3,
  hmtAddress: string,
  toAddress: string
): Promise<string | undefined> => {
  const HMT = new web3.eth.Contract(hmtAbi, hmtAddress);
  let txHash = '';
  try {
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
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return undefined;
  }

  return txHash;
};

export const checkFaucetBalance = async (web3: Web3, hmtAddress: string) => {
  if ((await getFaucetBalance(web3, hmtAddress)) < process.env.DAILY_LIMIT)
    return false;

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
