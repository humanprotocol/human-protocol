import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Signer } from 'ethers';
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import {
  HMToken,
  VHMToken,
  MetaHumanGovernor,
  DAOSpokeContract,
  TimelockController,
} from '../typechain-types';
import {
  createMockUserWithVotingPower,
  createBasicProposal,
} from './TestUtils';

let voteToken: VHMToken;
let governanceContract: MetaHumanGovernor;
let daoSpokeContract: DAOSpokeContract;
let someUserAddress: string;
let deployer: Signer;
let mockWormholeAddress: string;

export async function setUp(): Promise<{
  hmToken: HMToken;
  voteToken: VHMToken;
  governanceContract: MetaHumanGovernor;
  daoSpokeContract: DAOSpokeContract;
  timelockController: TimelockController;
  deployer: Signer;
}> {
  const signers = await ethers.getSigners();
  deployer = signers[0];
  const MockWormholeRelayerAddress = signers[1]; 

  mockWormholeAddress = await MockWormholeRelayerAddress.getAddress();

  const HMTokenFactory = await ethers.getContractFactory(
    'contracts/HMToken.sol:HMToken'
  );
  const hmToken = (await HMTokenFactory.deploy(
    ethers.utils.parseEther('100'),
    'HMToken',
    18,
    'HMT'
  )) as HMToken;
  await hmToken.deployed();

  // Deploy VHMToken
  const VHMTokenFactory = await ethers.getContractFactory(
    'contracts/vhm-token/VHMToken.sol:VHMToken'
  );
  const voteToken = (await VHMTokenFactory.deploy(hmToken.address)) as VHMToken;
  await voteToken.deployed();

  // Approve and deposit
  await hmToken.approve(voteToken.address, ethers.utils.parseEther('2'));
  await voteToken.depositFor(
    await ethers.provider.getSigner(0).getAddress(),
    ethers.utils.parseEther('2')
  );

  // TimelockController setup
  const TimelockControllerFactory = await ethers.getContractFactory(
    '@openzeppelin/contracts/governance/TimelockController.sol:TimelockController'
  );
  const adminAddress = await deployer.getAddress();
  const timelockController = (await TimelockControllerFactory.deploy(
    1,
    [await ethers.provider.getSigner(0).getAddress()],
    [ethers.constants.AddressZero],
    adminAddress
  )) as TimelockController;
  await timelockController.deployed();

  // Deploy MetaHumanGovernor
  const MetaHumanGovernorFactory = await ethers.getContractFactory(
    'contracts/MetaHumanGovernor.sol:MetaHumanGovernor'
  );
  const governanceContract = (await MetaHumanGovernorFactory.deploy(
    voteToken.address,
    timelockController.address,
    [],
    10002,
    mockWormholeAddress,
    await ethers.provider.getSigner(0).getAddress()
  )) as MetaHumanGovernor;
  await governanceContract.deployed();

  // Deploy DAOSpokeContract
  const DAOSpokeContractFactory = await ethers.getContractFactory(
    'contracts/DAOSpokeContract.sol:DAOSpokeContract'
  );
  const daoSpokeContract = (await DAOSpokeContractFactory.deploy(
    ethers.utils.hexlify(ethers.utils.randomBytes(32)), // Directly use 32 bytes random value
    10002,
    voteToken.address,
    12,
    5,
    mockWormholeAddress
  )) as DAOSpokeContract;
  await daoSpokeContract.deployed();

  await governanceContract.updateSpokeContracts([
    {
      contractAddress: ethers.utils.hexlify(ethers.utils.randomBytes(32)),
      chainId: 5,
    },
  ]);

  // // Mock calls
  // const testValue = 100;
  // await mockCall(
  //   daoSpokeContract,
  //   "0xMockWormholeAddress",
  //   testValue,
  //   ethers.utils.arrayify(ethers.utils.randomBytes(32)), // Mock data
  //   ethers.utils.defaultAbiCoder.encode(["bool", "string"], [true, "test"])
  // );

  // await mockCall(
  //   daoSpokeContract,
  //   "0xMockWormholeAddress",
  //   testValue,
  //   ethers.utils.arrayify(ethers.utils.randomBytes(32)), // Mock data
  //   ethers.utils.defaultAbiCoder.encode(["bool", "string"], [true, "test"])
  // );

  return {
    hmToken,
    voteToken,
    governanceContract,
    daoSpokeContract,
    timelockController,
    deployer,
  };
}

describe('DAOSpokeContract Tests', function () {
  beforeEach(async function () {
    const setup = await setUp();
    // console.log("Setup: ", setup);
    daoSpokeContract = setup.daoSpokeContract;
    voteToken = setup.voteToken;
    deployer = setup.deployer;
    someUserAddress = await createMockUserWithVotingPower(1, voteToken);
  });

  it('should verify that a user has voted when they have indeed voted', async function () {
    if (!deployer) {
      console.error('Deployer is undefined');
      return;
    }
    const proposalId = await createBasicProposal(
      deployer,
      voteToken,
      governanceContract
    );

    const someUser = daoSpokeContract.connect(
      await ethers.getSigner(someUserAddress)
    );
    await someUser.castVote(proposalId, 0);

    expect(await daoSpokeContract.hasVoted(proposalId, someUserAddress)).to.be
      .true;
  });

  it('should verify that a user has not voted when they have not indeed voted', async function () {
    if (!deployer) {
      console.error('Deployer is undefined');
      return;
    }
    const proposalId = await createBasicProposal(
      deployer,
      voteToken,
      governanceContract
    );
    const someUserAddress = await createMockUserWithVotingPower(1, voteToken);

    expect(await daoSpokeContract.hasVoted(proposalId, someUserAddress)).to.be
      .false;
  });

  it('should return false for isProposal when no proposals are created', async function () {
    const isProposal = await daoSpokeContract.isProposal(1);
    expect(isProposal).to.be.false;
  });

  it('should return true for isProposal when a proposal is created', async function () {
    const proposalId = await createBasicProposal(
      deployer,
      voteToken,
      governanceContract
    );
    const isProposal = await daoSpokeContract.isProposal(proposalId);
    expect(isProposal).to.be.true;
  });

  it('should emit a VoteCast event when a vote is cast', async function () {
    const proposalId = await createBasicProposal(
      deployer,
      voteToken,
      governanceContract
    );
    const someUserAddress = await createMockUserWithVotingPower(1, voteToken);
    const someUser = daoSpokeContract.connect(
      await ethers.getSigner(someUserAddress)
    );

    await ethers.provider.send('evm_mine', []);

    await expect(someUser.castVote(proposalId, 0))
      .to.emit(daoSpokeContract, 'VoteCast')
      .withArgs(someUserAddress, proposalId, 0, anyValue, '');

    const voteWeight = await daoSpokeContract.callStatic.castVote(
      proposalId,
      0
    );
    expect(voteWeight).to.be.gt(0);
  });

  it('should allow a user to cast a vote against and have vote weight greater than 0', async function () {
    const proposalId = await createBasicProposal(
      deployer,
      voteToken,
      governanceContract
    );
    const someUserAddress = await createMockUserWithVotingPower(1, voteToken);
    const someUser = daoSpokeContract.connect(
      await ethers.getSigner(someUserAddress)
    );

    await ethers.provider.send('evm_mine', []);

    const voteWeight = await someUser.callStatic.castVote(proposalId, 0);
    await someUser.castVote(proposalId, 0);

    expect(voteWeight).to.be.gt(0);
  });

  it('should allow a user to cast a vote for and have vote weight greater than 0', async function () {
    const proposalId = await createBasicProposal(
      deployer,
      voteToken,
      governanceContract
    );
    const someUserAddress = await createMockUserWithVotingPower(1, voteToken);
    const someUser = daoSpokeContract.connect(
      await ethers.getSigner(someUserAddress)
    );

    await ethers.provider.send('evm_mine', []);

    const voteWeight = await someUser.callStatic.castVote(proposalId, 1);
    await someUser.castVote(proposalId, 1);

    expect(voteWeight).to.be.gt(0);
  });

  it('should allow a user to abstain from voting and have vote weight greater than 0', async function () {
    const proposalId = await createBasicProposal(
      deployer,
      voteToken,
      governanceContract
    );
    const someUserAddress = await createMockUserWithVotingPower(1, voteToken);
    const someUser = daoSpokeContract.connect(
      await ethers.getSigner(someUserAddress)
    );

    await ethers.provider.send('evm_mine', []);

    const voteWeight = await someUser.callStatic.castVote(proposalId, 2);
    await someUser.castVote(proposalId, 2);

    expect(voteWeight).to.be.gt(0);
  });

  it('should revert when casting a vote with an invalid option', async function () {
    const proposalId = await createBasicProposal(
      deployer,
      voteToken,
      governanceContract
    );
    const someUserAddress = await createMockUserWithVotingPower(1, voteToken);
    const someUser = daoSpokeContract.connect(
      await ethers.getSigner(someUserAddress)
    );

    await expect(someUser.castVote(proposalId, 100)).to.be.revertedWith(
      'DAOSpokeContract: invalid value for enum VoteType'
    );
  });

  // TO DO
  it('should revert when casting a vote on a finished proposal', async function () {});

  it('should revert when casting a vote for a non-existent proposal', async function () {
    const proposalId = 1;

    const someUserAddress = await createMockUserWithVotingPower(1, voteToken);
    const someUser = daoSpokeContract.connect(
      await ethers.getSigner(someUserAddress)
    );

    await expect(someUser.castVote(proposalId, 1)).to.be.revertedWith(
      'DAOSpokeContract: not a started vote'
    );
  });

  it('should revert when casting a vote again for a proposal', async function () {
    const proposalId = await createBasicProposal(
      deployer,
      voteToken,
      governanceContract
    );

    const someUserAddress = await createMockUserWithVotingPower(1, voteToken);
    const someUser = daoSpokeContract.connect(
      await ethers.getSigner(someUserAddress)
    );

    await someUser.castVote(proposalId, 1);

    await expect(someUser.castVote(proposalId, 1)).to.be.revertedWith(
      'DAOSpokeContract: vote already cast'
    );
  });

  // TO DO
  it('should revert when receiving a message from a sender that is not the hub contract', async function () {});
  //   const proposalId = 1;
  //   const message = ethers.utils.defaultAbiCoder.encode(
  //     ["uint256", "uint256", "uint256"],
  //     [0, proposalId, Math.floor(Date.now() / 1000)]
  //   );

  //   const payload = ethers.utils.defaultAbiCoder.encode(
  //     ["address", "uint16", "address", "bytes"],
  //     [daoSpokeContract.address, spokeChainId, deployer.address, message]
  //   );

  //   const mockPayload = createMessageWithPayload(payload, spokeChainId, someUserAddress);

  //   mockPayload.emitterAddress = ethers.utils.hexZeroPad(someUserAddress, 32);

  //   await expect(
  //     callReceiveMessageOnSpokeWithMock(wormholeMockAddress, daoSpokeContract, mockPayload)
  //   ).to.be.revertedWith("Only messages from the hub contract can be received!");
  // });
});

export default setUp;
