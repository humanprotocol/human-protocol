const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
  path: path.join(__dirname, process.env.DOCKER ? './.env.docker' : './.env'),
});

const addresses = {
  hmt: process.env.HMT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  escrowFactory:
    process.env.ESCROW_FACTORY_ADDRESS ||
    '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  recOracle:
    process.env.REC_ORACLE_ADDRESS ||
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  repOracle:
    process.env.REP_ORACLE_ADDRESS ||
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  exchangeOracle:
    process.env.EXCHANGE_ORACLE_ADDRESS ||
    '0x6b7E3C31F34cF38d1DFC1D9A8A59482028395809',
};

const urls = {
  ethHTTPServer: process.env.ETH_HTTP_SERVER || 'http://127.0.0.1:8545',
  manifestUrl:
    process.env.MANIFEST_URL || 'http://localhost:9000/manifests/manifest.json',
  localManifestUrl: 'http://localhost:9000/manifests/manifest.json',
};

const stakes = {
  repOracle: process.env.REP_ORACLE_STAKE || 10,
  recOracle: process.env.REC_ORACLE_STAKE || 10,
};

const gasLimit = process.env.GAS_LIMIT || 5000000;
const escrowFundAmount = process.env.ESCROW_FUND_AMOUNT || 30;
const statusesMap = [
  'Launched',
  'Pending',
  'Partial',
  'Paid',
  'Complete',
  'Cancelled',
];

module.exports = {
  addresses,
  urls,
  stakes,
  gasLimit,
  escrowFundAmount,
  statusesMap,
};
