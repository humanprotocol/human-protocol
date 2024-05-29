/* eslint-disable no-console */
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
import bodyParser from 'body-parser';
import cors from 'cors';
import express, { Request, Response } from 'express';
import RateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';
import path from 'path';
import Web3 from 'web3';
import { ChainId, NETWORKS } from '@human-protocol/sdk';
import { FAUCET_NETWORKS } from './constants/networks';
import { lastSendType } from './interfaces/lastSendType';
import {
  checkFaucetBalance,
  getFaucetBalance,
  getHmtBalance,
  getWeb3,
  sendFunds,
} from './services/web3';
import { sendSlackNotification } from './services/slack';

// init express
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
const port = process.env.APP_PORT;

// set up rate limiter: maximum of five requests per second
app.use(
  RateLimit({
    windowMs: 1 * 1000, // 1 second
    max: 5,
  })
);

// init cache
const blockList = new NodeCache();

// init queue
const lastSend: lastSendType[] = [];

const getNetworkData = (chainId: ChainId) => {
  return {
    ...NETWORKS[chainId],
    ...FAUCET_NETWORKS[chainId],
  };
};

app.get('/stats', async (_request: Request, response: Response) => {
  const chainId = Number(_request.query.chainId);
  // Check for valid network
  const network = getNetworkData(chainId as ChainId);
  if (!network)
    return response.status(200).json({
      status: false,
      message: 'Invalid Chain Id',
    });

  if (!network.rpcUrl?.length) {
    return response.status(200).json({
      status: false,
      message: 'Faucet is disabled',
    });
  }

  const web3 = getWeb3(network.rpcUrl);
  response.send({
    account: web3.eth.defaultAccount,
    balance: await getFaucetBalance(web3, network.hmtAddress),
    dailyLimit: process.env.DAILY_LIMIT,
  });
});

app.get('/queue', async (_request: Request, response: Response) => {
  response.send({ lastSend: lastSend });
});

app.post('/faucet', async (request: Request, response: Response) => {
  const chainId = request.body.chainId;
  const toAddress = request.body.address.replace(' ', '');

  // Check for valid network
  const network = getNetworkData(chainId as ChainId);
  if (!network)
    return response.status(200).json({
      status: false,
      message: 'Invalid Chain Id',
    });

  if (!network.rpcUrl?.length) {
    return response.status(200).json({
      status: false,
      message: 'Faucet is disabled',
    });
  }

  // check for valid Eth address
  if (!Web3.utils.isAddress(toAddress))
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
      message: `Your ip address has already requested testnet ETH today. The remaining time for next request is ${msToTime(
        waitTime
      )}`,
    });
  }

  // check tx address availability
  if (blockList.get(toAddress)) {
    const waitTime: number = Number(blockList.getTtl(toAddress)) - Date.now();
    return response.status(200).json({
      status: false,
      message: `Your wallet address has already requested testnet ETH today. The remaining time for next request is ${msToTime(
        waitTime
      )}.`,
    });
  }

  const web3 = getWeb3(network.rpcUrl);

  // Check min HMT balance
  if (
    (await getHmtBalance(web3, network.hmtAddress)) <
    BigInt(process.env.FAUCET_MIN_BALANCE)
  ) {
    const message = `Low faucet balance detection in network ${network.title} with token address ${network.hmtAddress} and wallet address ${web3.eth.defaultAccount}`;
    sendSlackNotification(message);
  }

  // Check min native balance
  if (
    (await web3.eth.getBalance(web3.eth.defaultAccount)) <
    BigInt(process.env.NATIVE_MIN_BALANCE)
  ) {
    const message = `Low native balance detection in network ${network.title} with wallet address ${web3.eth.defaultAccount}`;
    sendSlackNotification(message);
  }

  if (!(await checkFaucetBalance(web3, network.hmtAddress))) {
    const message = `Faucet out of balance on ${network.title}`;
    sendSlackNotification(message);

    return response.status(200).json({
      status: false,
      message: 'Faucet out of balance.',
    });
  }

  const txHash = await sendFunds(web3, network.hmtAddress, toAddress);

  if (txHash) {
    lastSend.push({
      time: Date.now(),
      address: toAddress,
      txHash: txHash,
    });
    while (lastSend.length > 5) lastSend.shift();
  }

  if (Number(process.env.IP_WAITING_TIME) > 0)
    blockList.set(ipAddress, true, Number(process.env.IP_WAITING_TIME));
  if (Number(process.env.ADDRESS_WAITING_TIME) > 0)
    blockList.set(toAddress, true, Number(process.env.ADDRESS_WAITING_TIME));

  return response.status(200).json({
    status: true,
    message: `Requested successfully`,
    txHash: txHash,
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
