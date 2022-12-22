import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';

import Escrow from '@human-protocol/core/artifacts/contracts/Escrow.sol/Escrow.json';
import EscrowFactory from '@human-protocol/core/artifacts/contracts/EscrowFactory.sol/EscrowFactory.json';
import HMToken from '@human-protocol/core/artifacts/contracts/HMToken.sol/HMToken.json';
import Staking from '@human-protocol/core/artifacts/contracts/Staking.sol/Staking.json';
import { beforeAll, describe, expect, it } from '@jest/globals';

import {
  getEscrowManifestUrl,
  getEscrowStatus,
  getRecordingOracleAddress,
  storeResults,
} from './escrow';

let token: Contract;
let staking: Contract;
let escrowFactory: Contract;
let escrowAddress: string;
let escrow: Contract;

const recordingOracle = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const reputationOracle = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';

const web3 = new Web3('http://127.0.0.1:8547');
const owner = web3.eth.accounts.privateKeyToAccount(
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
);
const recordingAccount = web3.eth.accounts.privateKeyToAccount(
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
);
web3.eth.defaultAccount = recordingAccount.address;

describe('Escrow', () => {
  beforeAll(async () => {
    const tokenContract = new web3.eth.Contract(HMToken.abi as []);
    token = await tokenContract
      .deploy({
        data: HMToken.bytecode,
        arguments: [
          web3.utils.toWei('100000', 'ether'),
          'Human Token',
          18,
          'HMT',
        ],
      })
      .send({
        from: owner.address,
      });

    const stakingContract = new web3.eth.Contract(Staking.abi as []);
    staking = await stakingContract
      .deploy({
        data: Staking.bytecode,
        arguments: [token.options.address, web3.utils.toWei('1', 'ether'), 1],
      })
      .send({
        from: owner.address,
      });

    const escrowFactoryContract = new web3.eth.Contract(
      EscrowFactory.abi as []
    );
    escrowFactory = await escrowFactoryContract
      .deploy({
        data: EscrowFactory.bytecode,
        arguments: [token.options.address, staking.options.address],
      })
      .send({
        from: owner.address,
      });

    await token.methods
      .approve(staking.options.address, web3.utils.toWei('500', 'ether'))
      .send({ from: owner.address });

    await staking.methods
      .stake(web3.utils.toWei('500', 'ether'))
      .send({ from: owner.address });

    await escrowFactory.methods
      .createEscrow([owner.address])
      .send({ from: owner.address });

    escrowAddress = await escrowFactory.methods.lastEscrow().call();

    const value = web3.utils.toWei('30', 'ether');
    await token.methods
      .transfer(escrowAddress, value)
      .send({ from: owner.address });

    escrow = new web3.eth.Contract(Escrow.abi as [], escrowAddress);
    await escrow.methods
      .setup(
        reputationOracle,
        recordingOracle,
        10,
        10,
        'manifestUrl',
        'manifestUrl'
      )
      .send({ from: owner.address });
  });

  it('Get escrow status', async () => {
    const status = await getEscrowStatus(web3, escrowAddress);
    expect(status).toBe('1');
  });

  it('Get manifest URL', async () => {
    const manifest = await getEscrowManifestUrl(web3, escrowAddress);
    expect(manifest).toBe('manifestUrl');
  });

  it('Get escrow recording oracle', async () => {
    const recordingOracleAddress = await getRecordingOracleAddress(
      web3,
      escrowAddress
    );
    expect(recordingOracleAddress).toBe(recordingOracle);
  });

  it('Check store intermediate results', async () => {
    const result = await storeResults(
      web3,
      escrowAddress,
      'testUrl',
      'testHash'
    );
    expect(result.events.IntermediateStorage.returnValues).not.toBeNull();
    expect(result.events.IntermediateStorage.returnValues._url).toBe('testUrl');
    expect(result.events.IntermediateStorage.returnValues._hash).toBe(
      'testHash'
    );
  }, 10000);
});
