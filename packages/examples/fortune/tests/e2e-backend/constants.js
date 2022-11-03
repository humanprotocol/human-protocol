const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, './.env') });

const addresses = {
    hmt: process.env.HMT_ADDRESS || '0x444c45937D2202118a0FF9c48d491cef527b59dF',
    escrowFactory: process.env.ESCROW_FACTORY_ADDRESS || '0x3FF93a3847Cd1fa62DD9BcfE351C4b6BcCcF10cB',
    recOracle: '0x61F9F0B31eacB420553da8BCC59DC617279731Ac',
    repOracle: '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
    exchangeOracle: '0x6b7E3C31F34cF38d1DFC1D9A8A59482028395809',
};

const urls = {
    ethHTTPServer: process.env.ETH_HTTP_SERVER || 'http://localhost:8545',
    manifestUrl: process.env.MANIFEST_URL || 'http://minio-test:9000/manifests/docker-manifest.json',
    localManifestUrl: 'http://localhost:9000/manifests/docker-manifest.json',
};

const stakes = {
    repOracle: process.env.REP_ORACLE_STAKE || 10,
    recOracle: process.env.REC_ORACLE_STAKE || 10,
};

const gasLimit = process.env.GAS_LIMIT || 5000000;
const escrowFundAmount = process.env.ESCROW_FUND_AMOUNT || 30;
const statusesMap = ['Launched', 'Pending', 'Partial', 'Paid', 'Complete', 'Cancelled'];


module.exports = {
    addresses,
    urls,
    stakes,
    gasLimit,
    escrowFundAmount,
    statusesMap,
}