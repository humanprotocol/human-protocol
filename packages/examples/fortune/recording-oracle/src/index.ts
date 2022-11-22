import Web3 from 'web3';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { addFortune } from './services/fortune';

const app = express();

const port = process.env.PORT || 3005;

const privKey =
  process.env.ETH_PRIVATE_KEY ||
  '59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'; // ganaches priv key
const ethHttpServer = process.env.ETH_HTTP_SERVER || 'http://127.0.0.1:8545';
const web3 = new Web3(ethHttpServer);
const account = web3.eth.accounts.privateKeyToAccount(`0x${privKey}`);

web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

app.use(bodyParser.json());

app.use(cors());

app.post('/job/results', async (req, res) => {
  try {
    const { workerAddress, escrowAddress, fortune } = req.body;
    const err = await addFortune(web3, workerAddress, escrowAddress, fortune);
    if (err) {
      console.log(err.message);
      return res.status(400).send(err);
    }

    return res.status(201).send();
  } catch (err) {
    console.error(err);

    return res.status(500).send(err);
  }
});

app.listen(port, () => {
  console.log(`Recording Oracle server listening port ${port}`);
});
