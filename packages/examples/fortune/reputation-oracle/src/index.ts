import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import Web3 from 'web3';
import {
  bulkPayOut,
  getBalance,
  getEscrowManifestUrl,
} from './services/escrow';
import { filterAddressesToReward } from './services/rewards';
import { uploadResults } from './services/s3';
import getManifest from './services/manifest';
import { ChainId, REPUTATION_NETWORKS } from './constants/constants';

const app = express();
const privKey =
  process.env.ETH_PRIVATE_KEY ||
  '5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';
const port = process.env.PORT || 3006;

app.use(bodyParser.json());

app.post('/send-fortunes', async (req, res) => {
  try {
    const errorMessage: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    req.body.forEach((escrow: any) => {
      const fortunes = escrow.fortunes;
      const chainId = Number(escrow.chainId) as ChainId;

      if (!chainId) {
        errorMessage.push(`ChainId is empty or invalid`);
      }
      const network = REPUTATION_NETWORKS[chainId];
      if (!network) {
        errorMessage.push('ChainId not supported');
      }

      if (Object.keys(fortunes).length === 0) {
        errorMessage.push(
          `Fortunes of ${escrow.escrowAddress} are not specified or empty`
        );
      }

      if (!Web3.utils.isAddress(escrow.escrowAddress)) {
        errorMessage.push(
          `Escrow address ${escrow.escrowAddress} is empty or invalid`
        );
      }
    });

    if (errorMessage.length > 0) {
      return res.status(400).send({
        message: JSON.stringify(errorMessage),
      });
    }
    for (const escrow of req.body) {
      const fortunes = escrow.fortunes;
      const chainId = Number(escrow.chainId) as ChainId;
      const network = REPUTATION_NETWORKS[chainId];
      if (!network) throw new Error('ChainId not supported');
      const web3 = new Web3(network.rpcUrl);
      const account = web3.eth.accounts.privateKeyToAccount(`0x${privKey}`);
      web3.eth.accounts.wallet.add(account);
      web3.eth.defaultAccount = account.address;

      const manifestUrl = await getEscrowManifestUrl(
        web3,
        escrow.escrowAddress
      );
      const { recordingOracleAddress } = await getManifest(manifestUrl);

      const balance = await getBalance(web3, escrow.escrowAddress);
      const { workerAddresses } = filterAddressesToReward(
        web3,
        fortunes,
        recordingOracleAddress
      );
      const rewards = Array(workerAddresses.length).fill(
        (balance / workerAddresses.length).toString()
      );

      // TODO calculate the URL hash(?)
      const resultsUrl = await uploadResults(escrow, escrow.escrowAddress);
      const resultHash = resultsUrl;
      try {
        await bulkPayOut(
          web3,
          escrow.escrowAddress,
          workerAddresses,
          rewards,
          resultsUrl,
          resultHash
        );
      } catch {
        errorMessage.push(
          `Escrow ${escrow.escrowAddress} payout couldn't be done`
        );
      }
    }
    if (errorMessage.length > 0) {
      return res.status(400).send({
        message: JSON.stringify(errorMessage),
      });
    }

    return res.status(200).send({ message: 'Escrows have been completed' });
  } catch (err) {
    return res.status(500).send({ message: err });
  }
});

app.listen(port, () => {
  // TODO: Implement logger
  // eslint-disable-next-line no-console
  console.log(`Reputation Oracle server listening the port ${port}`);
});
