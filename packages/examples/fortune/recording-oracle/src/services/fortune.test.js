const Web3 = require('web3');
const {
  describe, expect, it, beforeAll,
} = require('@jest/globals');
const addFortune = require('./fortune');
const Escrow = require('../build/contracts/Escrow.json');
const HMToken = require('../build/contracts/HMToken.json');
const EscrowFactory = require('../build/contracts/EscrowFactory.json');
const manifest = require('./manifest');
const reputationClient = require('./reputationClient');
const storage = require('./storage');
const { bulkPayout } = require('./reputationClient');
const { getManifest } = require('./manifest');

let token;
let escrowFactory;
let escrowAddress;
let escrow;

const worker1 = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
const worker2 = '0xcd3B766CCDd6AE721141F452C550Ca635964ce71';
const web3 = new Web3('http://localhost:8545');
const account = web3.eth.accounts.privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
const recordingAccount = web3.eth.accounts.privateKeyToAccount('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d');
web3.eth.defaultAccount = recordingAccount.address;
jest.mock('./manifest');
jest.mock('./reputationClient');

describe('Fortune', () => {
  beforeAll(async () => {
    const tokenContract = new web3.eth.Contract(HMToken.abi);
    token = await tokenContract.deploy({
      data: HMToken.bytecode,
      arguments: [web3.utils.toWei('100000', 'ether'), 'Human Token', 18, 'HMT'],
    })
      .send({
        from: account.address,
      });

    const escrowFactoryContract = new web3.eth.Contract(EscrowFactory.abi);
    escrowFactory = await escrowFactoryContract.deploy({
      data: EscrowFactory.bytecode,
      arguments: [token.options.address],
    })
      .send({
        from: account.address,
      });
  });

  beforeEach(async () => {
    await escrowFactory.methods
      .createEscrow([account.address])
      .send({ from: account.address });

    escrowAddress = await escrowFactory.methods
      .lastEscrow()
      .call();

    const value = web3.utils.toWei('10', 'ether');
    await token.methods.transfer(escrowAddress, value).send({ from: account.address });

    escrow = new web3.eth.Contract(
      Escrow.abi,
      escrowAddress,
    );
    await escrow.methods.setup(
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      10,
      10,
      'manifestUrl',
      'manifestUrl',
    ).send({ from: account.address });
    manifest.getManifest.mockResolvedValue({ fortunes_requested: 2, reputationOracleUrl: '' });
    reputationClient.bulkPayout.mockResolvedValue();
  });

  it('Add fortunes successfully', async () => {
    let err = await addFortune(web3, worker1, escrowAddress, 'fortune 1');
    expect(storage.getEscrow(escrowAddress)).toBeDefined();
    expect(storage.getWorkerResult(escrowAddress, worker1)).toBe('fortune 1');
    expect(storage.getFortunes(escrowAddress).length).toBe(1);
    expect(err).toBeNull();
    err = await addFortune(web3, worker2, escrowAddress, 'fortune 2');
    expect(storage.getEscrow(escrowAddress)).toBeDefined();
    expect(storage.getFortunes(escrowAddress).length).toBe(0); // after reaching the fortunes desired the store is cleaned
    expect(getManifest).toHaveBeenCalledTimes(2);
    expect(bulkPayout).toHaveBeenCalledTimes(1);
    expect(err).toBeNull();
  });

  it('Do not allow two fortunes from the same worker', async () => {
    let err = await addFortune(web3, worker1, escrowAddress, 'fortune 1');
    expect(storage.getEscrow(escrowAddress)).toBeDefined();
    expect(storage.getWorkerResult(escrowAddress, worker1)).toBe('fortune 1');
    expect(storage.getFortunes(escrowAddress).length).toBe(1);
    expect(err).toBeNull();
    err = await addFortune(web3, worker1, escrowAddress, 'fortune 2');
    expect(storage.getEscrow(escrowAddress)).toBeDefined();
    expect(storage.getFortunes(escrowAddress).length).toBe(1);
    expect(err.message).toBe('0x90F79bf6EB2c4f870365E785982E1f101E93b906 already submitted a fortune');
  });

  it('Do not allow empty fortune', async () => {
    const err = await addFortune(web3, worker1, escrowAddress, '');
    expect(storage.getEscrow(escrowAddress)).toBeUndefined();
    expect(err.message).toBe('Non-empty fortune is required');
  });

  it('Invalid escrow address', async () => {
    const err = await addFortune(web3, worker1, 'escrowAddress', 'fortune 1');
    expect(storage.getEscrow(escrowAddress)).toBeUndefined();
    expect(err.message).toBe('Valid ethereum address required');
  });

  it('Invalid recording oracle address', async () => {
    web3.eth.defaultAccount = account.address;
    const err = await addFortune(web3, worker1, escrowAddress, 'fortune 1');
    expect(storage.getEscrow(escrowAddress)).toBeUndefined();
    expect(err.message).toBe('The Escrow Recording Oracle address mismatches the current one');
    web3.eth.defaultAccount = recordingAccount.address;
  });

  it('Escrow not pending', async () => {
    await escrow.methods.cancel().send({
      from: account.address,
    });
    const err = await addFortune(web3, worker1, escrowAddress, 'fortune 1');
    expect(err.message).toBe('The Escrow is not in the Pending status');
  });
});
