const EscrowFile = require('../build/contracts/Escrow.json');
const storage = require('./storage');
const { getManifest } = require('./manifest');
const { bulkPayout } = require('./reputationClient');

const EscrowABI = EscrowFile.abi;

const statusesMap = ['Launched', 'Pending', 'Partial', 'Paid', 'Complete', 'Cancelled'];

async function addFortune(web3, workerAddress, escrowAddress, fortune) {
  if (!web3.utils.isAddress(workerAddress)) {
    return { field: 'workerAddress', message: 'Valid ethereum address required' };
  }
  if (!fortune) {
    return { field: 'fortune', message: 'Non-empty fortune is required' };
  }

  if (!web3.utils.isAddress(escrowAddress)) {
    return { field: 'escrowAddress', message: 'Valid ethereum address required' };
  }
  const Escrow = new web3.eth.Contract(EscrowABI, escrowAddress);
  const escrowRecOracleAddr = await Escrow.methods.recordingOracle().call();

  if (web3.utils.toChecksumAddress(escrowRecOracleAddr) !== web3.utils.toChecksumAddress(web3.eth.defaultAccount)) {
    return { field: 'escrowAddress', message: 'The Escrow Recording Oracle address mismatches the current one' };
  }

  const escrowStatus = await Escrow.methods.status().call();

  if (statusesMap[escrowStatus] !== 'Pending') {
    return { field: 'escrowAddress', message: 'The Escrow is not in the Pending status' };
  }

  const manifestUrl = await Escrow.methods.manifestUrl().call();
  const { fortunes_requested: fortunesRequested, reputation_oracle_url: reputationOracleUrl } = await getManifest(manifestUrl);

  if (!storage.getEscrow(escrowAddress)) {
    storage.newEscrow(escrowAddress);
  }

  const workerPreviousResult = storage.getWorkerResult(escrowAddress, workerAddress);

  if (workerPreviousResult) {
    return { message: `${workerAddress} already submitted a fortune` };
  }

  storage.putFortune(escrowAddress, workerAddress, fortune);
  const fortunes = storage.getFortunes(escrowAddress);
  if (fortunes.length === fortunesRequested) {
    await bulkPayout(reputationOracleUrl, escrowAddress, fortunes);
    storage.cleanFortunes(escrowAddress);
  }

  return null;
}

module.exports = addFortune;
