import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Signer, BigNumberish } from 'ethers';
import {
  MetaHumanGovernor,
  VHMToken,
  HMToken,
  TimelockController,
  DAOSpokeContract,
  Governor,
} from '../typechain-types';
import {
  createMockUserWithVotingPower,
  createBasicProposal,
  mineNBlocks,
  createProposalOnSpoke,
} from './GovernanceUtils';

describe.only('DAOSpokeContract', function () {
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let user3: Signer;
  let wormholeMock: Signer;
  let proposers: string[];
  const executors: string[] = [ethers.ZeroAddress];
  let governor: MetaHumanGovernor;
  let governance: Governor;
  let voteToken: VHMToken;
  let token: HMToken;
  let timelockController: TimelockController;
  let daoSpoke: DAOSpokeContract;
  let newDAOSpoke: DAOSpokeContract;

  beforeEach(async () => {
    [owner, user1, user2, user3, wormholeMock] = await ethers.getSigners();

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
    await token.approve(voteToken.getAddress(), 5000000);
    await voteToken.depositFor(owner.getAddress(), 5000000);

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
      await wormholeMock.getAddress(),
      owner.getAddress(),
      12
    )) as MetaHumanGovernor;

    // Deploy DAOSpokeContract
    const DAOSpokeContract = await ethers.getContractFactory(
      'contracts/governance/DAOSpokeContract.sol:DAOSpokeContract'
    );
    daoSpoke = (await DAOSpokeContract.deploy(
      ethers.zeroPadBytes(await governor.getAddress(), 32),
      5, // hubChainId
      voteToken.getAddress(),
      12, // voting period
      6, // spokeChainId
      await wormholeMock.getAddress(),
      owner.getAddress() // admin address
    )) as DAOSpokeContract;
  });

  it('should hasVoted return true when voted', async () => {
    // uint256 proposalId = _createProposalOnSpoke();
    // address someUser = _createMockUserWithVotingPower(1, voteToken);
    // vm.roll(block.number + 3);
    // vm.startPrank(someUser);
    // daoSpokeContract.castVote(proposalId, 0);
    // vm.stopPrank();
    // bool hasVoted = daoSpokeContract.hasVoted(proposalId, someUser);
    // assertTrue(hasVoted);

    const proposalId = await createProposalOnSpoke(
      daoSpoke,
      wormholeMock,
      1,
      await governor.getAddress()
    );

    await createMockUserWithVotingPower(voteToken, user1);

    await mineNBlocks(3);

    await daoSpoke.connect(user1).castVote(proposalId, 0);
    const hasVoted = await daoSpoke.hasVoted(
      proposalId,
      await user1.getAddress()
    );
    expect(hasVoted).to.be.true;
  });
});
