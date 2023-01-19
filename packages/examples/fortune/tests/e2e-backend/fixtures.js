const {
  addresses,
  urls,
  stakes,
  gasLimit,
  escrowFundAmount,
  minioSettings,
} = require('./constants');
const escrowAbi = require('@human-protocol/core/abis/Escrow.json');
const hmtokenAbi = require('@human-protocol/core/abis/HMToken.json');
const factoryAbi = require('@human-protocol/core/abis/EscrowFactory.json');

const axios = require('axios');
const Web3 = require('web3');
const Minio = require('minio');
const web3 = new Web3(urls.ethHTTPServer);
const Token = new web3.eth.Contract(hmtokenAbi, addresses.hmt);

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

const createEscrow = async (escrowFactory) => {
  const account = (await web3.eth.getAccounts())[0];

  await escrowFactory.methods
    .createEscrow([account])
    .send({ from: account, gasLimit });
};

const fundEscrow = async (escrowAddress) => {
  const account = (await web3.eth.getAccounts())[0];
  const value = web3.utils.toWei(`${escrowFundAmount}`, 'ether');
  await Token.methods
    .transfer(escrowAddress, value)
    .send({ from: account, gasLimit });
};

const setupEscrow = async (
  escrowAddress,
  repOracleAddress,
  recOracleAddress,
  reoOracleStake,
  recOracleStake,
  escrow
) => {
  const account = (await web3.eth.getAccounts())[0];
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
      .send({ from: account, gasLimit });
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
    for (let i = 3; i < fortunesRequested + 3; i++) {
      agents[i - 3] = accounts[i];
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

const getS3File = async (escrowAddress) => {
  const fileName = `${escrowAddress}.json`;

  const file = await minioClient.getObject(
    minioSettings.minioBucketName,
    fileName
  );

  return file;
};

module.exports = {
  createEscrowFactory,
  createEscrow,
  fundEscrow,
  setupEscrow,
  setupAgents,
  sendFortune,
  calculateRewardAmount,
  getS3File,
};
