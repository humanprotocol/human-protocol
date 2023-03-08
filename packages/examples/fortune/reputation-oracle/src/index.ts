import express from 'express';
import bodyParser from 'body-parser';
import { calculateRewardForWorker } from './services/rewards';
import { uploadResults } from './services/s3';
import { Address } from '@multiversx/sdk-core/out';
import * as dotenv from 'dotenv';
import {
  initWeb3,
  initSigner,
  processAddress,
  getServiceForAddress,
} from './utils/utils';
import { Web3Service } from './utils/web3.service';
dotenv.config();

const app = express();
const privKey =
  process.env.ETH_PRIVATE_KEY ||
  '5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';
const ethHttpServer = process.env.ETH_HTTP_SERVER || 'http://127.0.0.1:8545';
const port = process.env.PORT || 3006;
const MX_MNEMONIC_PATH =
  process.env.MX_MNEMONIC_KEY || './mx-wallets/HUMAN-test-reputation.mnemonic';

const web3 = initWeb3(ethHttpServer, privKey);
const mxSigner = initSigner(MX_MNEMONIC_PATH);

app.use(bodyParser.json());

app.post('/job/results', async (req, res) => {
  try {
    const { fortunes, escrowAddress } = req.body;

    if (!Array.isArray(fortunes) || fortunes.length === 0) {
      return res
        .status(400)
        .send({ message: 'Fortunes are not specified or empty' });
    }

    let processedEscrowAddress: Address | string;
    try {
      processedEscrowAddress = processAddress(escrowAddress, web3);
    } catch (ex) {
      if (ex instanceof Error) {
        return res.status(400).send({ message: ex.message });
      }

      return res.status(400).send({ message: 'Invalid escrow address' });
    }

    const escrowContract = getServiceForAddress(
      processedEscrowAddress,
      web3,
      mxSigner
    );

    const balance = await escrowContract.getBalance();

    const workerAddresses = escrowContract.filterAddressesToReward(fortunes);
    const rewards = calculateRewardForWorker(balance, workerAddresses);

    // TODO calculate the URL hash(?)
    const resultsUrl = await uploadResults(
      fortunes.map(({ fortune }) => fortune),
      escrowAddress
    );

    const resultHash = resultsUrl;
    try {
      await escrowContract.bulkPayOut(
        workerAddresses,
        rewards,
        resultsUrl,
        resultHash
      );
    } catch (e) {
      return res.status(400).send({ message: "Payout couldn't be done" });
    }

    if (escrowContract instanceof Web3Service) {
      if (!(await escrowContract.bulkPaid())) {
        return res.status(400).send({ message: "Payout couldn't be done" });
      }
    }

    return res.status(200).send({ message: 'Escrow has been completed' });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: err });
  }
});

app.listen(port, () => {
  console.log(`Reputation Oracle server listening the port ${port}`);
});
