const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
  path: path.join(__dirname, process.env.DOCKER ? './.env.docker' : './.env'),
});

const addresses = {
  hmt: process.env.HMT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  escrowFactory:
    process.env.ESCROW_FACTORY_ADDRESS ||
    '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
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

const minioSettings = {
  minioHost: process.env.MINIO_HOST || 'localhost',
  minioPort: Number(process.env.MINIO_PORT) || 9000,
  minioAccessKey: process.env.MINIO_ACCESS_KEY || 'dev',
  minioSecretKey: process.env.MINIO_SECRET_KEY || 'devdevdev',
  minioBucketName: process.env.MINIO_BUCKET_NAME || 'job-results',
};

module.exports = {
  addresses,
  urls,
  stakes,
  gasLimit,
  escrowFundAmount,
  statusesMap,
  minioSettings,
};
