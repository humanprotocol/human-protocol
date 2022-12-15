const {
  addresses,
  urls,
  stakes,
  gasLimit,
  escrowFundAmount,
} = require('./constants');
const escrowAbi = require('@human-protocol/core/abis/Escrow.json');
const hmtokenAbi = require('@human-protocol/core/abis/HMToken.json');
const factoryAbi = require('@human-protocol/core/abis/EscrowFactory.json');
const stakingAbi = require('@human-protocol/core/abis/Staking.json');

const axios = require('axios');
const Web3 = require('web3');
const web3 = new Web3(urls.ethHTTPServer);
const Token = new web3.eth.Contract(hmtokenAbi, addresses.hmt);
let owner;
let launcher;

const setupAccounts = async () => {
  owner = (await web3.eth.getAccounts())[0];
  launcher = (await web3.eth.getAccounts())[3];
  await fundAccountHMT(launcher, owner, 1000);
  return [owner, launcher];
};

const createEscrowFactory = () => {
  const escrowFactory = new web3.eth.Contract(
    factoryAbi,
    addresses.escrowFactory
  );

  return escrowFactory;
};

const stake = async (escrowFactory) => {
  const stakingAddress = await escrowFactory.methods.staking().call();
  const staking = new web3.eth.Contract(stakingAbi, stakingAddress);

  await Token.methods
    .approve(stakingAddress, 5)
    .send({ from: launcher, gasLimit });
  await staking.methods.stake(5).send({ from: launcher, gasLimit });
};

const createEscrow = async (escrowFactory) => {
  await escrowFactory.methods
    .createEscrow([launcher])
    .send({ from: launcher, gasLimit });
  return await escrowFactory.methods.lastEscrow().call();
};

const fundAccountHMT = async (to, from, amount) => {
  const value = web3.utils.toWei(`${amount || escrowFundAmount}`, 'ether');
  await Token.methods
    .transfer(to, value)
    .send({ from: from || launcher, gasLimit });
};

const setupEscrow = async (
  escrowAddress,
  repOracleAddress,
  recOracleAddress,
  reoOracleStake,
  recOracleStake,
  escrow
) => {
  const Escrow = escrow || new web3.eth.Contract(escrowAbi, escrowAddress);
  try {
    await Escrow.methods
      .setup(
        repOracleAddress || addresses.repOracle,
        recOracleAddress || addresses.recOracle,
        reoOracleStake || stakes.repOracle,
        recOracleStake || stakes.recOracle,
        urls.manifestUrl,
        urls.manifestUrl
      )
      .send({ from: launcher, gasLimit });
  } catch (err) {
    return err;
  }

  return Escrow;
};

const setupAgents = async () => {
  try {
    const { fortunes_requested: fortunesRequested } = (
      await axios.get(urls.localManifestUrl)
    ).data;
    const agents = [];
    const accounts = await web3.eth.getAccounts();
    for (let i = 4; i < fortunesRequested + 4; i++) {
      agents[i - 4] = accounts[i];
    }

    return agents;
  } catch (err) {
    return err;
  }
};

const sendFortune = async (address, escrowAddress, fortune) => {
  const body = {
    workerAddress: address,
    escrowAddress: escrowAddress,
    fortune: fortune || `Agent: ${address}`,
  };
  try {
    const res = await axios.post('http://localhost:3005/job/results', body);
    return res;
  } catch (err) {
    return err.response;
  }
};

const calculateRewardAmount = async () => {
  const manifestResponse = await axios.get(urls.localManifestUrl);
  const { fortunes_requested: fortunesRequested } = manifestResponse.data;

  const balance = web3.utils.toWei(`${escrowFundAmount}`, 'ether');
  const workerEvenReward = balance / fortunesRequested;

  const repOracleReward = (workerEvenReward / 100) * stakes.repOracle;
  const recOracleReward = (workerEvenReward / 100) * stakes.recOracle;

  const totalWorkerReward =
    workerEvenReward - repOracleReward - recOracleReward;
  const totalRepOracleReward = repOracleReward * fortunesRequested;
  const totalRecOracleReward = recOracleReward * fortunesRequested;

  return { totalWorkerReward, totalRepOracleReward, totalRecOracleReward };
};

module.exports = {
  setupAccounts,
  createEscrowFactory,
  createEscrow,
  fundAccountHMT,
  setupEscrow,
  setupAgents,
  sendFortune,
  calculateRewardAmount,
  stake,
};
