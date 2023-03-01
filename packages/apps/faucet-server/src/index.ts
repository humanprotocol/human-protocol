/* eslint-disable no-console */
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
import path from 'path';
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import Web3 from 'web3';
import NodeCache from 'node-cache';
import async from 'async';
import cors from 'cors';
import hmtAbi from '@human-protocol/core/abis/HMToken.json';

// init express
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
const port = process.env.APP_PORT;

// init web3
const web3 = new Web3(process.env.RPC_URL as string);
const faucetAccount = web3.eth.accounts.privateKeyToAccount(
  `0x${process.env.PRIVATE_KEY}`
);
web3.eth.accounts.wallet.add(faucetAccount);
web3.eth.defaultAccount = faucetAccount.address;
const HMT = new web3.eth.Contract(hmtAbi as [], process.env.HMT_ADDRESS);

// init cache
const blockList = new NodeCache();

// init queue
interface lastSendType {
  time: number;
  address: string;
  txHash: string;
}
const lastSend: lastSendType[] = [];
const sendQueue = async.queue(async (task: { address: string }) => {
  console.log(`donating to ${task.address}`);
  const txHash = await sendFunds(task.address);

  if (txHash) {
    lastSend.push({ time: Date.now(), address: task.address, txHash: txHash });
    while (lastSend.length > 5) lastSend.shift();

    // waiting payoutFrequency sec
    await new Promise((resolve) =>
      setTimeout(resolve, Number(process.env.PAYOUT_FRECUENCY) * 1000)
    );
  }
}, 1);

sendQueue.drain();

const getFaucetBalance = async () => {
  const balance = web3.utils.fromWei(
    await HMT.methods.balanceOf(faucetAccount.address).call(),
    'ether'
  );
  return balance;
};

const sendFunds = async (toAddress: string): Promise<string | undefined> => {
  let txHash = '';
  try {
    const gasNeeded = await HMT.methods
      .transfer(
        toAddress,
        Web3.utils.toWei(process.env.DAILY_LIMIT as string, 'ether')
      )
      .estimateGas({ from: web3.eth.defaultAccount });
    const gasPrice = await web3.eth.getGasPrice();
    const receipt = await HMT.methods
      .transfer(
        toAddress,
        Web3.utils.toWei(process.env.DAILY_LIMIT as string, 'ether')
      )
      .send({ from: web3.eth.defaultAccount, gas: gasNeeded, gasPrice });
    console.log(`Transaction successful with hash: ${receipt.transactionHash}`);
    txHash = receipt.transactionHash;
  } catch (err) {
    console.log(err);
    return undefined;
  }

  return txHash;
};

app.get('/stats', async (_request: Request, response: Response) => {
  response.send({
    account: faucetAccount.address,
    balance: await getFaucetBalance(),
    dailyLimit: process.env.DAILY_LIMIT,
    blockNumber: await web3.eth.getBlockNumber(),
  });
});

app.get('/queue', async (_request: Request, response: Response) => {
  response.send({ lastSend: lastSend });
});

app.post('/faucet', async (request: Request, response: Response) => {
  const toAddress = request.body.address.replace(' ', '');
  // check for valid Eth address
  if (!web3.utils.isAddress(toAddress))
    return response.status(200).json({
      status: false,
      message:
        'Your account address is invalid. Please check your account address (it should start with 0x).',
    });

  // extract ip
  let ipAddress = request.ip || request.socket.remoteAddress;
  if (!ipAddress)
    return response.status(200).json({
      status: false,
      message: 'Testnet ETH request fail. Please try again!',
    });
  ipAddress = ipAddress.replace(/\./g, '_');

  // check ip address availability
  if (blockList.has(ipAddress)) {
    const waitTime: number = Number(blockList.getTtl(ipAddress)) - Date.now();
    return response.status(200).json({
      status: false,
      message: `Your ip address has already requested testnet ETH today :) The remaining time for next request is ${msToTime(
        waitTime
      )}`,
    });
  }

  // check tx address availability
  if (blockList.get(toAddress)) {
    const waitTime: number = Number(blockList.getTtl(toAddress)) - Date.now();
    return response.status(200).json({
      status: false,
      message: `Your wallet address has already requested testnet ETH today :) The remaining time for next request is ${msToTime(
        waitTime
      )}.`,
    });
  }

  const prevTx = sendQueue.length();
  if (prevTx >= 5) {
    return response.status(200).json({
      status: false,
      message: 'The faucet queue is full. Please try again later.',
    });
  }

  sendQueue.push({ address: toAddress });
  if (Number(process.env.IP_WAITING_TIME) > 0)
    blockList.set(ipAddress, true, Number(process.env.IP_WAITING_TIME));
  if (Number(process.env.ADDRESS_WAITING_TIME) > 0)
    blockList.set(toAddress, true, Number(process.env.ADDRESS_WAITING_TIME));

  return response.status(200).json({
    status: true,
    message: `Testnet ETH request added to the queue (${prevTx} tasks remaining). Enjoy!`,
  });
});

app.get('*', async (_request: Request, response: Response) => {
  response.sendFile(
    path.join(__dirname, '..', 'client', 'build', 'index.html')
  );
});

app.listen(port, () => {
  console.log(`Started on PORT ${port}`);
});

const msToTime = (duration: number) => {
  const seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  const formattedTime = [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
  ].join(':');

  return formattedTime;
};
