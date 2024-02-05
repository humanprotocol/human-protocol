/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Signer, BigNumberish } from 'ethers';
import {
  MetaHumanGovernor,
  VHMToken,
  HMToken,
  TimelockController,
  DAOSpokeContract,
} from '../typechain-types';

interface IWormholeSignature {
  r: string;
  s: string;
  v: number;
  guardianIndex: number;
}

interface IWormholeVM {
  version: number;
  timestamp: number;
  nonce: number;
  emitterChainId: number;
  emitterAddress: string;
  sequence: number;
  consistencyLevel: number;
  payload: string;
  guardianSetIndex: number;
  signatures: IWormholeSignature[];
  hash: string;
}

async function createMessageWithPayload(
  payload: string,
  emitterChainId: number,
  emitterAddress: string
): Promise<IWormholeVM> {
  const signatures: Signature[] = [];
  const mockVM: IWormholeVM = {
    version: 1,
    timestamp: 0,
    nonce: 0,
    emitterChainId: emitterChainId,
    emitterAddress: emitterAddress,
    sequence: 0,
    consistencyLevel: 200,
    payload: payload,
    guardianSetIndex: 0,
    signatures: signatures,
    hash: ethers.keccak256(payload),
  };

  return mockVM;
}

async function callReceiveMessageOnSpokeWithMock(
  daoSpoke: DAOSpokeContract,
  result: IWormholeVM
): Promise<void> {
  const vaas: string[] = [];

  await daoSpoke.receiveWormholeMessages(
    result.payload,
    vaas,
    result.emitterAddress,
    result.emitterChainId,
    result.hash
  );
}

async function createProposalOnSpoke(
  daoSpoke: DAOSpokeContract,
  proposalId: number,
  governorAddress: string
): Promise<number> {
  const spokeChainId = 6;
  const hubChainId = 5;

  const latestBlock = await ethers.provider.getBlock('latest');
  if (!latestBlock) {
    throw new Error('Failed to fetch the latest block');
  }
  const currentBlockTimestamp = latestBlock.timestamp;
  const futureTimestamp = currentBlockTimestamp + 1000;

  // Encode the message
  const message = ethers.solidityPacked(
    ['uint256', 'uint256', 'uint256', 'uint256'],
    [0, proposalId, currentBlockTimestamp, futureTimestamp]
  );

  const payload = ethers.solidityPacked(
    ['address', 'uint256', 'address', 'bytes'],
    [daoSpoke.getAddress(), spokeChainId, governorAddress, message]
  );

  const mockResult = await createMessageWithPayload(
    payload,
    hubChainId,
    governorAddress
  );

  await callReceiveMessageOnSpokeWithMock(daoSpoke, mockResult);
  return proposalId;
}

async function createBasicProposal(
  voteToken: VHMToken,
  governor: MetaHumanGovernor,
  owner: Signer
): Promise<BigNumber> {
  const encodedCall = voteToken.interface.encodeFunctionData('transfer', [
    await owner.getAddress(),
    1,
  ]);
  const targets = [await voteToken.getAddress()];
  const values: BigNumberish[] = [0];
  const calldatas = [encodedCall];

  const proposalId: BigNumber = await governor.crossChainPropose(
    targets,
    values,
    calldatas,
    ''
  );

  return proposalId;
}

describe('MetaHumanGovernor', function () {
  let owner: Signer;
  let proposers: string[];
  const executors: string[] = [ethers.ZeroAddress];
  let governor: MetaHumanGovernor;
  let voteToken: VHMToken;
  let token: HMToken;
  let timelockController: TimelockController;
  let daoSpoke: DAOSpokeContract;
  let newDAOSpoke: DAOSpokeContract;
  let wormholeRelayerAddress: Signer;

  this.beforeEach(async () => {
    const [deployer] = await ethers.getSigners();
    owner = deployer;

    // Deploy HMToken
    const HMToken = await ethers.getContractFactory(
      'contracts/HMToken.sol:HMToken'
    );
    token = (await HMToken.deploy(
      1000000000,
      'Human Token',
      18,
      'HMT'
    )) as HMToken;

    // Deploy VHMToken
    const VHMToken = await ethers.getContractFactory(
      'contracts/governance/vhm-token/VHMToken.sol:VHMToken'
    );
    voteToken = (await VHMToken.deploy(await token.getAddress())) as VHMToken;

    // Deposit vhmTokens
    await token.approve(voteToken.getAddress(), 10);
    await voteToken.depositFor(owner.getAddress(), 10);

    // Deploy TimelockController
    proposers = [await owner.getAddress()];
    const TimelockController =
      await ethers.getContractFactory('TimelockController');
    timelockController = await TimelockController.deploy(
      1,
      proposers,
      executors,
      owner.getAddress()
    );
    await timelockController.waitForDeployment();

    // Deploy MetaHumanGovernor
    const MetaHumanContract = await ethers.getContractFactory(
      'contracts/governance/MetaHumanGovernor.sol:MetaHumanGovernor'
    );
    governor = (await MetaHumanContract.deploy(
      voteToken.getAddress(),
      timelockController.getAddress(),
      [],
      5, // voting delay
      '0x0591C25ebd0580E0d4F27A82Fc2e24E7489CB5e0',
      owner.getAddress(),
      12
    )) as MetaHumanGovernor;

    // Deploy DAOSpokeContract
    const DAOSpokeContract = await ethers.getContractFactory(
      'contracts/governance/DAOSpokeContract.sol:DAOSpokeContract'
    );
    const DAOSpoke = (await DAOSpokeContract.deploy(
      ethers.zeroPadBytes(await governor.getAddress(), 32),
      5, // hubChainId
      voteToken.getAddress(),
      12, // voting period
      6, // spokeChainId
      '0x0591C25ebd0580E0d4F27A82Fc2e24E7489CB5e0',
      owner.getAddress() // admin address
    )) as DAOSpokeContract;
  });

  it('Should update spoke contracts correctly', async function () {
    // Deploy new Spoke
    const DAOSpokeContract = await ethers.getContractFactory(
      'contracts/governance/DAOSpokeContract.sol:DAOSpokeContract'
    );

    newDAOSpoke = (await DAOSpokeContract.deploy(
      ethers.zeroPadBytes(await governor.getAddress(), 32),
      5,
      await voteToken.getAddress(),
      12,
      6,
      '0x0591C25ebd0580E0d4F27A82Fc2e24E7489CB5e0',
      await owner.getAddress() // admin address
    )) as DAOSpokeContract;

    const spokeContractsX = [
      {
        contractAddress: ethers.zeroPadBytes(
          await newDAOSpoke.getAddress(),
          32
        ),
        chainId: 6,
      },
    ];

    await expect(governor.updateSpokeContracts(spokeContractsX)).to.emit(
      governor,
      'SpokesUpdated'
    );

    const updated = await governor.spokeContractsMapping(
      ethers.zeroPadBytes(await newDAOSpoke.getAddress(), 32),
      6
    );
    expect(updated).to.be.true;
  });

  it('Should revert when updating spoke contracts with duplicates', async function () {
    const DAOSpokeContract = await ethers.getContractFactory(
      'contracts/governance/DAOSpokeContract.sol:DAOSpokeContract'
    );

    const newDAOSpoke = (await DAOSpokeContract.deploy(
      ethers.zeroPadBytes(await governor.getAddress(), 32),
      5,
      voteToken.getAddress(),
      12,
      6,
      '0x0591C25ebd0580E0d4F27A82Fc2e24E7489CB5e0',
      owner.getAddress()
    )) as DAOSpokeContract;

    const spokeContracts = [
      {
        contractAddress: ethers.zeroPadBytes(
          await newDAOSpoke.getAddress(),
          32
        ),
        chainId: 6,
      },
      {
        contractAddress: ethers.zeroPadBytes(
          await newDAOSpoke.getAddress(),
          32
        ),
        chainId: 6,
      },
    ];
    await expect(
      governor.updateSpokeContracts(spokeContracts)
    ).to.be.revertedWith('Duplicates are not allowed');
  });

  it('Should update spoke contracts with unique entries successfully', async function () {
    const DAOSpokeContract = await ethers.getContractFactory(
      'contracts/governance/DAOSpokeContract.sol:DAOSpokeContract'
    );
    const newlyDeployedSpoke = await DAOSpokeContract.deploy(
      ethers.zeroPadBytes(await governor.getAddress(), 32),
      5,
      await voteToken.getAddress(),
      12,
      6,
      '0x0591C25ebd0580E0d4F27A82Fc2e24E7489CB5e0',
      await owner.getAddress()
    );

    const spokeContracts = [
      {
        contractAddress: ethers.zeroPadBytes(
          await newlyDeployedSpoke.getAddress(),
          32
        ),
        chainId: 6,
      },
      {
        contractAddress: ethers.zeroPadBytes(
          await newlyDeployedSpoke.getAddress(),
          32
        ),
        chainId: 7,
      },
    ];

    await governor.updateSpokeContracts(spokeContracts);

    const updated1 = await governor.spokeContractsMapping(
      ethers.zeroPadBytes(await newlyDeployedSpoke.getAddress(), 32),
      6
    );
    expect(updated1).to.be.true;

    const updated2 = await governor.spokeContractsMapping(
      ethers.zeroPadBytes(await newlyDeployedSpoke.getAddress(), 32),
      7
    );
    expect(updated2).to.be.true;
  });

  it('cannot update spoke contracts after transferring ownership', async function () {
    const DAOSpokeContract = await ethers.getContractFactory(
      'contracts/governance/DAOSpokeContract.sol:DAOSpokeContract'
    );
    const newlyDeployedSpoke = (await DAOSpokeContract.deploy(
      ethers.zeroPadBytes(await governor.getAddress(), 32),
      5,
      await voteToken.getAddress(),
      12,
      6,
      '0x0591C25ebd0580E0d4F27A82Fc2e24E7489CB5e0',
      await owner.getAddress()
    )) as DAOSpokeContract;
    const spokeChainId = 6;

    const spokeContracts = [
      {
        contractAddress: ethers.zeroPadBytes(
          await newlyDeployedSpoke.getAddress(),
          32
        ),
        chainId: spokeChainId,
      },
    ];

    // Transfer ownership to the timelockController
    await governor
      .connect(owner)
      .transferOwnership(await timelockController.getAddress());

    await expect(
      governor.connect(owner).updateSpokeContracts(spokeContracts)
    ).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('Should grant proposal creation', async function () {
    const proposalId = await createBasicProposal(voteToken, governor, owner);
  });
});
