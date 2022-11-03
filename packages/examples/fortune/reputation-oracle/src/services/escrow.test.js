const Web3 = require('web3');
const { getBalance, bulkPayOut, bulkPaid } = require('./escrow');
const {
  describe, expect, it, beforeAll,
} = require('@jest/globals');
const Escrow = require('../build/contracts/Escrow.json');
const HMToken = require('../build/contracts/HMToken.json');
const EscrowFactory = require('../build/contracts/EscrowFactory.json');

let token;
let escrowFactory;
let escrowAddress;
let escrow;

const worker1 = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
const worker2 = '0xcd3B766CCDd6AE721141F452C550Ca635964ce71';
const worker3 = '0x146D35a6485DbAFF357fB48B3BbA31fCF9E9c787';

const web3 = new Web3('http://localhost:8545');
const account = web3.eth.accounts.privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
const recordingAccount = web3.eth.accounts.privateKeyToAccount('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d');
web3.eth.defaultAccount = recordingAccount.address;

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

    const value = web3.utils.toWei('30', 'ether');
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
  });

  it('Get escrow balance', async () => {
    const balance = await getBalance(
      web3,
      escrowAddress,
    );
    expect(balance).toBe(30000000000000000000);
  });

  it('Bulk payout rewards, higher amount than balance', async () => {
    await bulkPayOut(
      web3,
      escrowAddress,
      [worker1, worker2, worker3],
      [web3.utils.toWei('15', 'ether'), web3.utils.toWei('15', 'ether'), web3.utils.toWei('15', 'ether')],
      'localhost',
      'localhost',
    );
    const result = await bulkPaid(web3, escrowAddress);

    expect(result).toBe(false);
    expect(await token.methods.balanceOf(worker1).call()).toBe(web3.utils.toWei('0', 'ether'));
    expect(await token.methods.balanceOf(worker1).call()).toBe(web3.utils.toWei('0', 'ether'));
    expect(await token.methods.balanceOf(worker1).call()).toBe(web3.utils.toWei('0', 'ether'));
  });

  it('Bulk payout rewards', async () => {
    await bulkPayOut(
      web3,
      escrowAddress,
      [worker1, worker2, worker3],
      [web3.utils.toWei('10', 'ether'), web3.utils.toWei('10', 'ether'), web3.utils.toWei('10', 'ether')],
      'localhost',
      'localhost',
    );
    const result = await bulkPaid(web3, escrowAddress);

    expect(result).toBe(true);
    expect(await token.methods.balanceOf(worker1).call()).toBe(web3.utils.toWei('8', 'ether'));
    expect(await token.methods.balanceOf(worker1).call()).toBe(web3.utils.toWei('8', 'ether'));
    expect(await token.methods.balanceOf(worker1).call()).toBe(web3.utils.toWei('8', 'ether'));
  });
});
