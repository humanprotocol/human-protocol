const express = require('express');
const bodyParser = require('body-parser');
const Web3 = require('web3');
const { bulkPayOut, getBalance } = require('./services/escrow');
const { filterAddressesToReward, calculateRewardForWorker } = require('./services/rewards');
const { uploadResults } = require('./services/s3');

const app = express();
const privKey = process.env.ETH_PRIVATE_KEY || '657b6497a355a3982928d5515d48a84870f057c4d16923eb1d104c0afada9aa8';
const ethHttpServer = process.env.ETH_HTTP_SERVER || 'http://localhost:8545';
const port = process.env.PORT || 3006;

const web3 = new Web3(ethHttpServer);
const account = web3.eth.accounts.privateKeyToAccount(`0x${privKey}`);

web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

app.use(bodyParser.json());

app.post('/job/results', async (req, res) => {
  try {
    const { fortunes, escrowAddress } = req.body;

    if (!Array.isArray(fortunes) || fortunes.length === 0) {
      return res.status(400).send({ message: 'Fortunes are not specified or empty' });
    }

    if (!web3.utils.isAddress(escrowAddress)) {
      return res.status(400).send({ message: 'Escrow address is empty or invalid' });
    }

    const balance = await getBalance(web3, escrowAddress);

    const workerAddresses = filterAddressesToReward(web3, fortunes);
    const rewards = calculateRewardForWorker(balance, workerAddresses);
    const resultsUrl = await uploadResults(fortunes.map(({ fortune }) => fortune), escrowAddress);
    // TODO calculate the URL hash(?)
    const resultHash = resultsUrl;

    await bulkPayOut(web3, escrowAddress, workerAddresses, rewards, resultsUrl, resultHash);

    return res.status(200).send({ message: 'Escrow has been completed' });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: err });
  }
});

app.listen(port, () => {
  console.log(`Reputation Oracle server listening the port ${port}`);
});
