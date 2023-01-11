import express from 'express';
import bodyParser from 'body-parser';
import Web3 from 'web3';
import { bulkPayOut, bulkPaid, getBalance } from './services/escrow';
import {
  filterAddressesToReward,
  calculateRewardForWorker,
} from './services/rewards';
import { uploadResults } from './services/s3';
import { updateReputations } from './services/reputation';

const app = express();
const privKey =
  process.env.ETH_PRIVATE_KEY ||
  '5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';
const ethHttpServer = process.env.ETH_HTTP_SERVER || 'http://127.0.0.1:8545';
const port = process.env.PORT || 3006;
const reputationAddress =
  process.env.REPUTATION_ADDRESS ||
  '0x09635F643e140090A9A8Dcd712eD6285858ceBef';

const web3 = new Web3(ethHttpServer);
const account = web3.eth.accounts.privateKeyToAccount(`0x${privKey}`);

web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

app.use(bodyParser.json());

app.post('/job/results', async (req, res) => {
  try {
    const { fortunes, escrowAddress } = req.body;

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

    const balance = await getBalance(web3, escrowAddress);

    const { workerAddresses, reputationValues } = filterAddressesToReward(
      web3,
      fortunes
    );

    const reputationScores = await updateReputations(
      web3,
      reputationAddress,
      reputationValues,
      workerAddresses
    );

    const rewards = calculateRewardForWorker(
      balance,
      workerAddresses,
      reputationScores
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
