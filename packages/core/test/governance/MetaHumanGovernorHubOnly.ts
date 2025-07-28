import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Signer, BigNumberish } from 'ethers';
import {
  MetaHumanGovernor,
  VHMToken,
  HMToken,
  TimelockController,
  WormholeMock,
} from '../typechain-types';
import {
  createMockUserWithVotingPower,
  mineNBlocks,
  signProposal,
  SECONDS_PER_BLOCK,
  createBasicProposalOnHub,
  updateVotingDelayOnHub,
} from './GovernanceUtils';

describe('MetaHumanGovernorHubOnly', function () {
  let owner: Signer;
  let user1: Signer;
  let wormholeMockForGovernor: WormholeMock;
  let proposers: string[];
  const executors: string[] = [ethers.ZeroAddress];
  let governor: MetaHumanGovernor;
  let voteToken: VHMToken;
  let token: HMToken;
  let timelockController: TimelockController;

  this.beforeEach(async () => {
    [owner, user1] = await ethers.getSigners();

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
    await token.approve(voteToken.getAddress(), ethers.parseEther('1000'));
    await voteToken.depositFor(owner.getAddress(), ethers.parseEther('100'));

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

    const WormholeMock = await ethers.getContractFactory('WormholeMock');

    // Deploy WormholeMock for Governor
    wormholeMockForGovernor = await WormholeMock.deploy();

    // Send 1 ether to wormholeMockForGovernor
    await owner.sendTransaction({
      to: await wormholeMockForGovernor.getAddress(),
      value: ethers.parseEther('1'),
    });

    // Deploy MetaHumanGovernor
    const MetaHumanContract = await ethers.getContractFactory(
      'contracts/governance/MetaHumanGovernor.sol:MetaHumanGovernor'
    );
    governor = (await MetaHumanContract.deploy(
      voteToken.getAddress(),
      timelockController.getAddress(),
      [],
      0,
      await wormholeMockForGovernor.getAddress(),
      owner.getAddress(),
      SECONDS_PER_BLOCK,
      SECONDS_PER_BLOCK * 1,
      SECONDS_PER_BLOCK * 300,
      0,
      4
    )) as MetaHumanGovernor;

    // Grant proposer role on timelock controller
    await timelockController.grantRole(
      ethers.id('PROPOSER_ROLE'),
      await governor.getAddress()
    );
    // Revoke timelock admin role
    await timelockController.revokeRole(
      ethers.id('TIMELOCK_ADMIN_ROLE'),
      await owner.getAddress()
    );
  });

  it('Should create a cross-chain grant proposal successfully', async function () {
    const encodedCall = voteToken.interface.encodeFunctionData('transfer', [
      await owner.getAddress(),
      50,
    ]);

    const targets = [await voteToken.getAddress()];
    const values: BigNumberish[] = [0];
    const calldatas = [encodedCall];

    const tx = await governor.crossChainPropose(
      targets,
      values,
      calldatas,
      'Description: test cross-chain proposal',
      {
        value: 100,
      }
    );
    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error('No receipt');
    }
    expect(receipt.status).to.equal(1);
    await expect(tx.wait()).to.not.be.reverted;
  });

  it('Should allow voting on a proposal', async function () {
    await createMockUserWithVotingPower(voteToken, user1);

    const proposalId = await createBasicProposalOnHub(
      voteToken,
      governor,
      owner
    );

    // Mine 2 blocks
    await mineNBlocks(2);

    // Cast vote
    await governor.connect(user1).castVote(proposalId, 1);

    const { againstVotes, forVotes, abstainVotes } =
      await governor.proposalVotes(proposalId);

    expect(againstVotes).to.equal(0);
    expect(forVotes).to.equal(ethers.parseEther('1'));
    expect(abstainVotes).to.equal(0);
  });

  it('Should revert when voting on a non-active proposal', async function () {
    // mock account with voting power
    await createMockUserWithVotingPower(voteToken, user1);

    // Update voting delay to 2
    await updateVotingDelayOnHub(voteToken, governor, 2, user1);

    // create proposal
    const proposalId = await createBasicProposalOnHub(
      voteToken,
      governor,
      owner
    );

    await expect(
      governor.connect(user1).castVote(proposalId, 1)
    ).to.be.revertedWithCustomError(
      governor,
      'GovernorUnexpectedProposalState'
    );
  });

  it('Should allow voting against', async function () {
    await createMockUserWithVotingPower(voteToken, user1);
    const proposalId = await createBasicProposalOnHub(
      voteToken,
      governor,
      owner
    );

    await mineNBlocks(2);

    await governor.connect(user1).castVote(proposalId, 0);
    const { againstVotes, forVotes, abstainVotes } =
      await governor.proposalVotes(proposalId);
    expect(againstVotes).to.equal(ethers.parseEther('1'));
    expect(forVotes).to.equal(0);
    expect(abstainVotes).to.equal(0);
  });

  it('Should allow voting abstain', async function () {
    await createMockUserWithVotingPower(voteToken, user1);
    const proposalId = await createBasicProposalOnHub(
      voteToken,
      governor,
      owner
    );
    await mineNBlocks(2);

    await governor.connect(user1).castVote(proposalId, 2);
    const { againstVotes, forVotes, abstainVotes } =
      await governor.proposalVotes(proposalId);
    expect(againstVotes).to.equal(0);
    expect(forVotes).to.equal(0);
    expect(abstainVotes).to.equal(ethers.parseEther('1'));
  });

  it('Should revert when voting with invalid option', async function () {
    await createMockUserWithVotingPower(voteToken, user1);
    const proposalId = await createBasicProposalOnHub(
      voteToken,
      governor,
      owner
    );
    await mineNBlocks(2);

    await expect(
      governor.connect(user1).castVote(proposalId, 5)
    ).to.be.revertedWith(
      'GovernorVotingSimple: invalid value for enum VoteType'
    );
  });

  it('Should revert when vote already cast', async function () {
    await createMockUserWithVotingPower(voteToken, user1);
    const proposalId = await createBasicProposalOnHub(
      voteToken,
      governor,
      owner
    );
    await mineNBlocks(2);

    await governor.connect(user1).castVote(proposalId, 1);
    await expect(
      governor.connect(user1).castVote(proposalId, 1)
    ).to.be.revertedWith('GovernorVotingSimple: vote already cast');
  });

  it('Should retrieve counting mode', async function () {
    const countingMode = await governor.COUNTING_MODE();
    expect(countingMode).to.equal('support=bravo&quorum=for,abstain');
  });

  it('Should not count vote when vote not cast', async function () {
    await createMockUserWithVotingPower(voteToken, user1);
    const proposalId = await createBasicProposalOnHub(
      voteToken,
      governor,
      owner
    );

    const hasVoted = await governor.hasVoted(
      proposalId,
      await user1.getAddress()
    );
    expect(hasVoted).to.be.false;
  });

  it('Should count vote when vote cast', async function () {
    await createMockUserWithVotingPower(voteToken, user1);
    const proposalId = await createBasicProposalOnHub(
      voteToken,
      governor,
      owner
    );
    await mineNBlocks(2);

    await governor.connect(user1).castVote(proposalId, 1);
    const hasVoted = await governor.hasVoted(
      proposalId,
      await user1.getAddress()
    );
    expect(hasVoted).to.be.true;
  });

  it('Should execute proposal successfully', async function () {
    // mock account with voting power
    await voteToken.transfer(await user1.getAddress(), ethers.parseEther('5'));
    await voteToken.connect(user1).delegate(await user1.getAddress());

    const encodedCall = token.interface.encodeFunctionData('transfer', [
      await user1.getAddress(),
      ethers.parseEther('1'),
    ]);
    await token.transfer(
      await timelockController.getAddress(),
      ethers.parseEther('1')
    );
    const targets = [await token.getAddress()];
    const values = [0];
    const calldatas = [encodedCall];

    const txReponse = await governor.crossChainPropose(
      targets,
      values,
      calldatas,
      'test1',
      {
        value: 100,
      }
    );
    const receipt = await txReponse.wait();
    const eventSignature = ethers.id(
      'ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)'
    );

    const event = receipt?.logs?.find(
      (log) => log.topics[0] === eventSignature
    );
    if (!event) throw new Error('ProposalCreated event not found');
    const decodedData = governor.interface.decodeEventLog(
      'ProposalCreated',
      event.data,
      event.topics
    );

    const proposalId = decodedData[0];

    // wait for next block
    await mineNBlocks(2);
    //cast vote
    await governor.connect(user1).castVote(proposalId, 1);

    // wait for voting block to end
    await mineNBlocks(50410);
    await governor.requestCollections(proposalId, { value: 100 });

    await governor.queue(targets, values, calldatas, ethers.id('test1'));
    // vm.warp(block.timestamp + 10) ??

    const balanceBeforeExecution = await token.balanceOf(
      await user1.getAddress()
    );
    await governor.execute(targets, values, calldatas, ethers.id('test1'));
    const balanceAfterExecution = await token.balanceOf(
      await user1.getAddress()
    );

    expect(balanceAfterExecution).to.be.greaterThan(balanceBeforeExecution);
  });

  it('Should revert to queue a proposal when a collection phase is unfinished ', async function () {
    const encodedCall = voteToken.interface.encodeFunctionData('transfer', [
      await owner.getAddress(),
      ethers.parseEther('1'),
    ]);
    await token.transfer(
      await timelockController.getAddress(),
      ethers.parseEther('1')
    );
    const targets = [await voteToken.getAddress()];
    const values = [0];
    const calldatas = [encodedCall];

    const txReponse = await governor.crossChainPropose(
      targets,
      values,
      calldatas,
      'test1',
      {
        value: 100,
      }
    );
    const receipt = await txReponse.wait();
    const eventSignature = ethers.id(
      'ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)'
    );

    const event = receipt?.logs?.find(
      (log) => log.topics[0] === eventSignature
    );
    if (!event) throw new Error('ProposalCreated event not found');
    const decodedData = governor.interface.decodeEventLog(
      'ProposalCreated',
      event.data,
      event.topics
    );

    const proposalId = decodedData[0];

    // mock account with voting power
    voteToken.transfer(await user1.getAddress(), ethers.parseEther('5'));
    voteToken.connect(user1).delegate(await user1.getAddress());

    // wait for next block
    await mineNBlocks(2);
    //cast vote
    await governor.connect(user1).castVote(proposalId, 1);

    // wait for voting block to end
    await mineNBlocks(50410);

    await expect(
      governor.queue(targets, values, calldatas, ethers.id('test1'))
    ).to.be.revertedWith('Governor: proposal not successful');
  });

  it('Should revert to execute proposal when collection is unfinished', async function () {
    // mock account with voting power
    voteToken.transfer(await user1.getAddress(), ethers.parseEther('5'));
    voteToken.connect(user1).delegate(await user1.getAddress());

    const encodedCall = token.interface.encodeFunctionData('transfer', [
      await user1.getAddress(),
      ethers.parseEther('1'),
    ]);

    await token.transfer(
      await timelockController.getAddress(),
      ethers.parseEther('1')
    );

    const targets = [await token.getAddress()];
    const values = [0];
    const calldatas = [encodedCall];

    const txReponse = await governor.crossChainPropose(
      targets,
      values,
      calldatas,
      'test1',
      {
        value: 100,
      }
    );
    const receipt = await txReponse.wait();
    const eventSignature = ethers.id(
      'ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)'
    );

    const event = receipt?.logs?.find(
      (log) => log.topics[0] === eventSignature
    );
    if (!event) throw new Error('ProposalCreated event not found');
    const decodedData = governor.interface.decodeEventLog(
      'ProposalCreated',
      event.data,
      event.topics
    );

    const proposalId = decodedData[0];

    // wait for next block
    await mineNBlocks(2);

    //cast vote
    await governor.connect(user1).castVote(proposalId, 1);

    // wait for voting block to end
    await mineNBlocks(50410);

    await expect(
      governor.execute(targets, values, calldatas, ethers.id('test1'))
    ).to.be.reverted;
  });

  it('Should get voting delay', async function () {
    const votingDelay = await governor.votingDelay();
    expect(votingDelay).to.equal(SECONDS_PER_BLOCK * 1); // This is just taken from MetaHumanGovernor.sol constructor (GovernorSettings)
  });

  it('Should get voting period', async function () {
    const votingPeriod = await governor.votingPeriod();
    expect(votingPeriod).to.equal(SECONDS_PER_BLOCK * 20 * 15); // This is just taken from MetaHumanGovernor.sol constructor (GovernorSettings)
  });

  it('Should get proposal qorum', async function () {
    await mineNBlocks(3);
    const latestBlockNumber = await ethers.provider.getBlockNumber();
    const oneBlockBeforLatest = await ethers.provider.getBlock(
      latestBlockNumber - 1
    );

    if (!oneBlockBeforLatest) {
      throw new Error('Block not found');
    }

    const quorum = await governor.quorum(oneBlockBeforLatest?.timestamp);
    expect(quorum).to.equal(ethers.parseEther('4'));
  });

  it('Should get Proposal State', async function () {
    const proposalId = await createBasicProposalOnHub(
      voteToken,
      governor,
      owner
    );

    const state = await governor.state(proposalId);
    const expectedState = 0;

    expect(state).to.equal(expectedState);
  });

  it('Should get proposal state when not succeeded', async function () {
    const proposalId = await createBasicProposalOnHub(
      voteToken,
      governor,
      owner
    );

    await mineNBlocks(50410);

    const state = await governor.state(proposalId);
    const expectedState = 3;
    expect(state).to.equal(expectedState);
  });

  it('Should get proposal state when collection not finished', async function () {
    const proposalId = await createBasicProposalOnHub(
      voteToken,
      governor,
      owner
    );

    await createMockUserWithVotingPower(voteToken, user1);

    await mineNBlocks(2);

    //cast vote
    await governor.connect(user1).castVote(proposalId, 1);

    await mineNBlocks(50410);

    const state = await governor.state(proposalId);
    const expectedState = 3; // we ensure it's not in pending state
    expect(state).to.equal(expectedState);
  });

  it('Should get proposal state when defeated and collection finished', async function () {
    await createMockUserWithVotingPower(voteToken, user1);

    const proposalId = await createBasicProposalOnHub(
      voteToken,
      governor,
      owner
    );

    await mineNBlocks(2);

    //cast vote
    await governor.connect(user1).castVote(proposalId, 0);

    await mineNBlocks(50410);

    await governor.requestCollections(proposalId, { value: 100 });

    const state = await governor.state(proposalId);
    const expectedState = 3;

    expect(state).to.equal(expectedState);
  });

  it('Should get proposal threshold', async function () {
    const threshold = await governor.proposalThreshold();
    expect(threshold).to.equal(0);
  });

  it('Should support interface IERC1155 Receiver', async function () {
    const supportsInterface = await governor.supportsInterface('0x4e2312e0');
    expect(supportsInterface).to.be.true;
  });

  it('Should finish collection phase', async function () {
    const proposalId = await createBasicProposalOnHub(
      voteToken,
      governor,
      owner
    );

    await mineNBlocks(50410);

    await governor.requestCollections(proposalId, { value: 100 });

    const collectionFinished = await governor.collectionFinished(proposalId);
    expect(collectionFinished).to.be.true;
  });

  it('Should request collections', async function () {
    const proposalId = await createBasicProposalOnHub(
      voteToken,
      governor,
      owner
    );

    await mineNBlocks(50410);
    await governor.requestCollections(proposalId, { value: 100 });
  });

  it('Should fails to request collections when voting period is not over', async function () {
    const proposalId = await createBasicProposalOnHub(
      voteToken,
      governor,
      owner
    );

    // Mine 2 blocks
    await mineNBlocks(2);

    await expect(
      governor.requestCollections(proposalId)
    ).to.be.revertedWithCustomError(governor, 'RequestAfterVotePeriodOver');
  });

  it('Should fails to request collections when collection already started', async function () {
    const proposalId = await createBasicProposalOnHub(
      voteToken,
      governor,
      owner
    );

    // Mine 50410 blocks
    await mineNBlocks(50410);

    await governor.requestCollections(proposalId, { value: 100 });

    await expect(
      governor.requestCollections(proposalId, { value: 100 })
    ).to.be.revertedWithCustomError(governor, 'CollectionPhaseAlreadyStarted');
  });

  it('Should vote on proposal with reason', async function () {
    await createMockUserWithVotingPower(voteToken, user1);

    const proposalId = await createBasicProposalOnHub(
      voteToken,
      governor,
      owner
    );

    // Mine 2 blocks
    await mineNBlocks(2);

    // Cast vote
    await governor
      .connect(user1)
      .castVoteWithReason(proposalId, 1, 'test reason');

    const { againstVotes, forVotes, abstainVotes } =
      await governor.proposalVotes(proposalId);

    expect(againstVotes).to.equal(0);
    expect(forVotes).to.equal(ethers.parseEther('1'));
    expect(abstainVotes).to.equal(0);
  });

  it('Should vote on proposal with reason and parameters', async function () {
    await createMockUserWithVotingPower(voteToken, user1);

    const proposalId = await createBasicProposalOnHub(
      voteToken,
      governor,
      owner
    );

    // Mine 2 blocks
    await mineNBlocks(2);

    // Cast vote
    await governor
      .connect(user1)
      .castVoteWithReasonAndParams(
        proposalId,
        1,
        'test reason',
        ethers.id('test params')
      );

    const { againstVotes, forVotes, abstainVotes } =
      await governor.proposalVotes(proposalId);

    expect(againstVotes).to.equal(0);
    expect(forVotes).to.equal(ethers.parseEther('1'));
    expect(abstainVotes).to.equal(0);
  });

  it('Should revert when voting on a non-active proposal with reason and params', async function () {
    await createMockUserWithVotingPower(voteToken, user1);

    await updateVotingDelayOnHub(voteToken, governor, 2, user1);

    const proposalId = await createBasicProposalOnHub(
      voteToken,
      governor,
      owner
    );

    const defaultAbiCoder = new ethers.AbiCoder();
    const params = defaultAbiCoder.encode(['string'], ['test params']);

    // Cast vote
    await expect(
      governor
        .connect(user1)
        .castVoteWithReasonAndParams(proposalId, 1, 'test reason', params)
    ).to.be.revertedWithCustomError(
      governor,
      'GovernorUnexpectedProposalState'
    );
  });

  it('Should vote on proposal by signature', async function () {
    await createMockUserWithVotingPower(voteToken, user1);

    const proposalId = await createBasicProposalOnHub(
      voteToken,
      governor,
      owner
    );

    // create signature
    const support = 1;
    const user1Address = await user1.getAddress();
    const signature = await signProposal(
      proposalId,
      governor,
      support,
      user1Address,
      0,
      user1
    );

    // wait for next block
    await mineNBlocks(2);
    // cast vote with sig
    await governor
      .connect(user1)
      .castVoteBySig(proposalId, support, user1Address, signature);

    //assert votes
    const { againstVotes, forVotes, abstainVotes } =
      await governor.proposalVotes(proposalId);

    expect(againstVotes).to.equal(0);
    expect(forVotes).to.equal(ethers.parseEther('1'));
    expect(abstainVotes).to.equal(0);
  });

  it('Should fail to vote on proposal by signature when not active', async function () {
    await createMockUserWithVotingPower(voteToken, user1);

    const proposalId = await createBasicProposalOnHub(
      voteToken,
      governor,
      owner
    );

    // create signature
    const support = 1;
    const user1Address = await user1.getAddress();
    const signature = await signProposal(
      proposalId,
      governor,
      support,
      user1Address,
      0,
      user1
    );

    // cast vote with sig
    await expect(
      governor
        .connect(user1)
        .castVoteBySig(proposalId, support, await user1.getAddress(), signature)
    ).to.be.revertedWithCustomError(
      governor,
      'GovernorUnexpectedProposalState'
    );
  });

  it('Should revert when creating proposal with propose', async function () {
    const encodedCall = voteToken.interface.encodeFunctionData('transfer', [
      await owner.getAddress(),
      ethers.parseEther('1'),
    ]);

    const targets = [await voteToken.getAddress()];
    const values = [0];
    const calldatas = [encodedCall];

    await expect(
      governor.propose(targets, values, calldatas, 'test')
    ).to.be.revertedWith('Please use crossChainPropose instead.');
  });

  it('Should return magistrate', async function () {
    const magistrate = await governor.magistrate();
    expect(magistrate).to.equal(await owner.getAddress());
  });

  it('Should allow to transfer magistrate', async function () {
    const newMagistrate = await user1.getAddress();
    await governor.connect(owner).transferMagistrate(newMagistrate);
    const magistrate = await governor.magistrate();
    expect(magistrate).to.equal(newMagistrate);
  });

  it('Should reverts when to transfer magistrate when its address zero', async function () {
    await expect(
      governor.transferMagistrate(ethers.ZeroAddress)
    ).to.be.revertedWith('Magistrate: new magistrate is the zero address');
  });

  it('Should withdraw as Magistrate', async function () {
    const contractBalance = await token.balanceOf(await governor.getAddress());
    const beforeWithdraw = await token.balanceOf(await owner.getAddress());
    await governor.connect(owner).withdrawFunds();
    const afterWithdraw = await token.balanceOf(await owner.getAddress());
    const diffference = afterWithdraw - beforeWithdraw;
    expect(diffference).to.equal(contractBalance);
  });

  it('Should reverts if not magistrate tries to withdraw', async function () {
    await expect(governor.connect(user1).withdrawFunds()).to.be.revertedWith(
      'Magistrate: caller is not the magistrate'
    );
  });
});
