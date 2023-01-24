import express from 'express';
import bodyParser from 'body-parser';
import Web3 from 'web3';
import {
  bulkPayOut,
  bulkPaid,
  getBalance,
  getEscrowManifestUrl,
} from './services/escrow';
import { filterAddressesToReward } from './services/rewards';
import { uploadResults } from './services/s3';
import {
  updateReputations,
  calculateRewardForWorker,
} from './services/reputation';
import getManifest from './services/manifest';
import { networks, NetworkSettings } from './constants/constants';

const app = express();
const privKey =
  process.env.ETH_PRIVATE_KEY ||
  '5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';
const port = process.env.PORT || 3006;

app.use(bodyParser.json());

app.post('/job/results', async (req, res) => {
  try {
    const { fortunes, escrowAddress, chainId } = req.body;

    const web3 = new Web3(
      networks[chainId as keyof NetworkSettings].httpServer
    );
    const account = web3.eth.accounts.privateKeyToAccount(`0x${privKey}`);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;

    if (!Array.isArray(fortunes) || fortunes.length === 0) {
      return res
        .status(400)
        .send({ message: 'Fortunes are not specified or empty' });
    }

    if (!web3.utils.isAddress(escrowAddress)) {
      return res
        .status(400)
        .send({ message: 'Escrow address is empty or invalid' });
    }

    const manifestUrl = await getEscrowManifestUrl(web3, escrowAddress);
    const { recording_oracle_address: recordingOracleAddress } =
      await getManifest(manifestUrl);

    const balance = await getBalance(web3, escrowAddress);

    const { workerAddresses, reputationValues } = filterAddressesToReward(
      web3,
      fortunes,
      recordingOracleAddress
    );

    await updateReputations(
      web3,
      networks[chainId as keyof NetworkSettings].reputation,
      reputationValues
    );
    const rewards = await calculateRewardForWorker(
      web3,
      networks[chainId as keyof NetworkSettings].reputation,
      balance.toString(),
      workerAddresses
    );

    // TODO calculate the URL hash(?)
    const resultsUrl = await uploadResults(
      fortunes.map(({ fortune }) => fortune),
      escrowAddress
    );
    const resultHash = resultsUrl;
    await bulkPayOut(
      web3,
      escrowAddress,
      workerAddresses,
      rewards,
      resultsUrl,
      resultHash
    );

    if (!(await bulkPaid(web3, escrowAddress))) {
      return res.status(400).send({ message: "Payout couldn't be done" });
    }

    return res.status(200).send({ message: 'Escrow has been completed' });
  } catch (err) {
    return res.status(500).send({ message: err });
  }
});

app.listen(port, () => {
  // TODO: Implement logger
  // eslint-disable-next-line no-console
  console.log(`Reputation Oracle server listening the port ${port}`);
});
