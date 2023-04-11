const {
  addresses,
  urls,
  stakes,
  gasLimit,
  escrowFundAmount,
  minioSettings,
  repOraclePrivateKey,
  fortunesRequested,
} = require('./constants');
const escrowAbi = require('../../../../core/abis/Escrow.json');
const hmtokenAbi = require('@human-protocol/core/abis/HMToken.json');
const factoryAbi = require('@human-protocol/core/abis/EscrowFactory.json');
const stakingAbi = require('@human-protocol/core/abis/Staking.json');
const reputationAbi = require('@human-protocol/core/abis/Reputation.json');

const axios = require('axios');
const Web3 = require('web3');
const Minio = require('minio');
const web3 = new Web3(urls.ethHTTPServer);
const Token = new web3.eth.Contract(hmtokenAbi, addresses.hmt);
const reputationOracle = web3.eth.accounts.privateKeyToAccount(
  `0x${repOraclePrivateKey}`
);
let owner;
let launcher;

const setupAccounts = async () => {
  owner = (await web3.eth.getAccounts())[0];
  launcher = (await web3.eth.getAccounts())[3];
  await fundAccountHMT(launcher, owner, 1000);
  // await fundAccountHMT(launcher, reputationOracle.address, 1000);

  return [owner, launcher];
};

const minioClient = new Minio.Client({
  endPoint: minioSettings.minioHost,
  port: minioSettings.minioPort,
  accessKey: minioSettings.minioAccessKey,
  secretKey: minioSettings.minioSecretKey,
  useSSL: false,
});

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

  await Token.methods
    .approve(stakingAddress, 5)
    .send({ from: reputationOracle.address, gasLimit });
  await staking.methods
    .stake(5)
    .send({ from: reputationOracle.address, gasLimit });
};

const createEscrow = async (escrowFactory) => {
  await escrowFactory.methods
    .createEscrow(addresses.hmt, [launcher])
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

const calculateRewardAmount = async (agentAddresses) => {
  const workerRewards = [];
  const repOracleRewards = [];
  const recOracleRewards = [];
  let totalReputation = 0,
    totalRecOracleReward = 0,
    totalRepOracleReward = 0;

  const balance = web3.utils.toWei(`${escrowFundAmount}`, 'ether');

  const Reputation = new web3.eth.Contract(reputationAbi, addresses.reputation);
  const reputationValues = await Reputation.methods
    .getReputations(agentAddresses)
    .call();

  reputationValues.forEach((element) => {
    totalReputation += Number(element.reputation);
  });

  agentAddresses.forEach((worker) => {
    const reputation = reputationValues.find(
      (element) => element.workerAddress === worker
    );
    const workerReward = web3.utils
      .toBN(balance)
      .mul(web3.utils.toBN(reputation?.reputation || 0))
      .div(web3.utils.toBN(totalReputation));
    const recReward = web3.utils
      .toBN(workerReward)
      .mul(web3.utils.toBN(stakes.recOracle))
      .div(web3.utils.toBN(100));
    const repReward = web3.utils
      .toBN(workerReward)
      .mul(web3.utils.toBN(stakes.repOracle))
      .div(web3.utils.toBN(100));
    workerRewards.push(workerReward);
    recOracleRewards.push(recReward);
    repOracleRewards.push(repReward);
    totalRecOracleReward = web3.utils.toBN(totalRecOracleReward).add(recReward);
    totalRepOracleReward = web3.utils.toBN(totalRepOracleReward).add(repReward);
  });
  return {
    workerRewards: workerRewards,
    repOracleRewards: repOracleRewards,
    recOracleRewards: recOracleRewards,
    totalRecOracleReward: totalRecOracleReward,
    totalRepOracleReward: totalRepOracleReward,
  };
};

const getS3File = async (escrowAddress) => {
  const fileName = `${escrowAddress}.json`;

  const file = await minioClient.getObject(
    minioSettings.minioBucketName,
    fileName
  );

  return file;
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
  getS3File,
};
