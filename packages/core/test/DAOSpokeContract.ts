import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import {
  MetaHumanGovernor,
  VHMToken,
  HMToken,
  TimelockController,
  DAOSpokeContract,
  WormholeMock,
} from '../typechain-types';
import {
  createMockUserWithVotingPower,
  mineNBlocks,
  createProposalOnSpoke,
  finishProposal,
  createProposalMessage,
  callReceiveMessageWithWormholeMock,
  createMessageWithPayload,
} from './GovernanceUtils';

describe.only('DAOSpokeContract', function () {
  let owner: Signer;
  let user1: Signer;
  let wormholeMockForDaoSpoke: WormholeMock;
  let wormholeMockForGovernor: WormholeMock;
  let proposers: string[];
  const executors: string[] = [ethers.ZeroAddress];
  let governor: MetaHumanGovernor;
  let voteToken: VHMToken;
  let token: HMToken;
  let timelockController: TimelockController;
  let daoSpoke: DAOSpokeContract;
  const secondsPerBlock = 12;

  beforeEach(async () => {
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
    await token.approve(voteToken.getAddress(), ethers.parseEther('5000000'));
    await voteToken.depositFor(
      owner.getAddress(),
      ethers.parseEther('5000000')
    );

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
      12,
      1,
      20 * 15,
      0,
      4
    )) as MetaHumanGovernor;

    // Set Governor on worm hole mock
    await wormholeMockForGovernor.setReceiver(await governor.getAddress());

    // Deploy WormholeMock for DAOSpokeContract
    wormholeMockForDaoSpoke = await WormholeMock.deploy();

    // Send 1 ether to wormholeMockForDaoSpoke
    await owner.sendTransaction({
      to: await wormholeMockForDaoSpoke.getAddress(),
      value: ethers.parseEther('1'),
    });

    // Deploy DAOSpokeContract
    const DAOSpokeContract = await ethers.getContractFactory(
      'contracts/governance/DAOSpokeContract.sol:DAOSpokeContract'
    );
    daoSpoke = (await DAOSpokeContract.deploy(
      ethers.zeroPadBytes(await governor.getAddress(), 32),
      5, // hubChainId
      voteToken.getAddress(),
      secondsPerBlock, // voting period
      6, // spokeChainId
      await wormholeMockForDaoSpoke.getAddress(),
      owner.getAddress() // admin address
    )) as DAOSpokeContract;

    // Set DAOSpokeContract on worm hole mock
    await wormholeMockForDaoSpoke.setReceiver(await daoSpoke.getAddress());
  });

  it('should hasVoted return true when voted', async () => {
    const proposalId = await createProposalOnSpoke(
      daoSpoke,
      wormholeMockForDaoSpoke,
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

  it('should hasVoted return false when hasnt voted', async () => {
    const proposalId = await createProposalOnSpoke(
      daoSpoke,
      wormholeMockForDaoSpoke,
      1,
      await governor.getAddress()
    );

    await createMockUserWithVotingPower(voteToken, user1);

    await mineNBlocks(3);

    const hasVoted = await daoSpoke.hasVoted(
      proposalId,
      await user1.getAddress()
    );

    expect(hasVoted).to.be.false;
  });

  it('should isProposal return false when proposal does not exist', async () => {
    const isProposal = await daoSpoke.isProposal(1);
    expect(isProposal).to.be.false;
  });

  it('should isProposal return true when proposal exists', async () => {
    const proposalId = await createProposalOnSpoke(
      daoSpoke,
      wormholeMockForDaoSpoke,
      1,
      await governor.getAddress()
    );

    const isProposal = await daoSpoke.isProposal(proposalId);
    expect(isProposal).to.be.true;
  });

  describe('castVote', () => {
    it('should emit VoteCast event when user votes for', async () => {
      await createMockUserWithVotingPower(voteToken, user1);

      const proposalId = await createProposalOnSpoke(
        daoSpoke,
        wormholeMockForDaoSpoke,
        1,
        await governor.getAddress()
      );

      await mineNBlocks(3);

      await expect(daoSpoke.connect(user1).castVote(proposalId, 0))
        .to.emit(daoSpoke, 'VoteCast')
        .withArgs(
          await user1.getAddress(),
          proposalId,
          0,
          ethers.parseEther('1'),
          ''
        );
    });

    it('should emit VoteCast event when user votes against', async () => {
      await createMockUserWithVotingPower(voteToken, user1);

      const proposalId = await createProposalOnSpoke(
        daoSpoke,
        wormholeMockForDaoSpoke,
        1,
        await governor.getAddress()
      );

      await mineNBlocks(3);

      await expect(daoSpoke.connect(user1).castVote(proposalId, 1))
        .to.emit(daoSpoke, 'VoteCast')
        .withArgs(
          await user1.getAddress(),
          proposalId,
          1,
          ethers.parseEther('1'),
          ''
        );
    });

    it('should emit VoteCast event when user votes abstain', async () => {
      await createMockUserWithVotingPower(voteToken, user1);

      const proposalId = await createProposalOnSpoke(
        daoSpoke,
        wormholeMockForDaoSpoke,
        1,
        await governor.getAddress()
      );

      await mineNBlocks(3);

      await expect(daoSpoke.connect(user1).castVote(proposalId, 2))
        .to.emit(daoSpoke, 'VoteCast')
        .withArgs(
          await user1.getAddress(),
          proposalId,
          2,
          ethers.parseEther('1'),
          ''
        );
    });

    it('should revert when vote option is invalid', async () => {
      await createMockUserWithVotingPower(voteToken, user1);

      const proposalId = await createProposalOnSpoke(
        daoSpoke,
        wormholeMockForDaoSpoke,
        1,
        await governor.getAddress()
      );

      await mineNBlocks(3);

      await expect(
        daoSpoke.connect(user1).castVote(proposalId, 3)
      ).to.be.revertedWith('DAOSpokeContract: invalid value for enum VoteType');
    });

    it('should revert when vote is finished', async () => {
      await createMockUserWithVotingPower(voteToken, user1);

      const proposalId = await createProposalOnSpoke(
        daoSpoke,
        wormholeMockForDaoSpoke,
        1,
        await governor.getAddress()
      );

      await finishProposal(
        daoSpoke,
        wormholeMockForDaoSpoke,
        proposalId,
        await governor.getAddress()
      );

      await expect(
        daoSpoke.connect(user1).castVote(proposalId, 0)
      ).to.be.revertedWith('DAOSpokeContract: vote finished');
    });

    it('should revert when proposal does not exist', async () => {
      await createMockUserWithVotingPower(voteToken, user1);

      await expect(daoSpoke.connect(user1).castVote(1, 0)).to.be.revertedWith(
        'DAOSpokeContract: not a started vote'
      );
    });

    it('should revert when the vote was already cast', async () => {
      await createMockUserWithVotingPower(voteToken, user1);

      const proposalId = await createProposalOnSpoke(
        daoSpoke,
        wormholeMockForDaoSpoke,
        1,
        await governor.getAddress()
      );

      await mineNBlocks(3);

      await daoSpoke.connect(user1).castVote(proposalId, 0);

      await expect(
        daoSpoke.connect(user1).castVote(proposalId, 0)
      ).to.be.revertedWith('DAOSpokeContract: vote already cast');
    });
  });

  describe('receiveMessage', () => {
    it('should revert when sender is not hub contract', async () => {
      await createMockUserWithVotingPower(voteToken, user1);

      const mockPayload = await createProposalMessage(
        await daoSpoke.getAddress(),
        1,
        await user1.getAddress()
      );

      await expect(
        callReceiveMessageWithWormholeMock(wormholeMockForDaoSpoke, mockPayload)
      ).to.be.revertedWith(
        'Only messages from the hub contract can be received!'
      );
    });

    it('should revert when contract is not intended recipient', async () => {
      const mockPayload = await createProposalMessage(
        await wormholeMockForDaoSpoke.getAddress(),
        1,
        await governor.getAddress()
      );

      await expect(
        callReceiveMessageWithWormholeMock(wormholeMockForDaoSpoke, mockPayload)
      ).to.be.revertedWith('Message is not addressed for this contract');
    });

    it('should revert when proposal id is not unique', async () => {
      const mockPayload = await createProposalMessage(
        await daoSpoke.getAddress(),
        1,
        await governor.getAddress()
      );

      await callReceiveMessageWithWormholeMock(
        wormholeMockForDaoSpoke,
        mockPayload
      );
      await expect(
        callReceiveMessageWithWormholeMock(wormholeMockForDaoSpoke, mockPayload)
      ).to.be.revertedWith('Message already processed');
    });

    it('should process message when proposal start before block timestamp', async () => {
      const proposalId = 1;

      const spokeChainId = 6;
      const hubChainId = 5;

      const latestBlock = await ethers.provider.getBlock('latest');
      if (!latestBlock) {
        throw new Error('Failed to fetch the latest block');
      }

      const defaultAbiCoder = new ethers.AbiCoder();

      const message = defaultAbiCoder.encode(
        ['uint16', 'uint256', 'uint256', 'uint256', 'uint256'],
        [
          0,
          proposalId,
          latestBlock.timestamp - secondsPerBlock * 2,
          latestBlock.timestamp - secondsPerBlock * 2,
          latestBlock.timestamp + secondsPerBlock * 10,
        ]
      );

      const payload = defaultAbiCoder.encode(
        ['address', 'uint256', 'address', 'bytes'],
        [
          await daoSpoke.getAddress(),
          spokeChainId,
          await governor.getAddress(),
          message,
        ]
      );

      await callReceiveMessageWithWormholeMock(
        wormholeMockForDaoSpoke,
        await createMessageWithPayload(
          payload,
          hubChainId,
          await governor.getAddress()
        )
      );

      const proposal = await daoSpoke.proposals(proposalId);

      expect(proposal.proposalCreation).to.equal(
        latestBlock.timestamp - secondsPerBlock * 2
      );
      expect(proposal.localVoteStart).to.equal(
        latestBlock.timestamp - secondsPerBlock * 2
      );
      expect(proposal.localVoteEnd).to.equal(
        latestBlock.timestamp + secondsPerBlock * 10
      );
      expect(proposal.localVoteStartBlock).to.equal(latestBlock.number - 1);
    });

    it('should process message when proposal start after block timestamp', async () => {
      const proposalId = 1;

      const spokeChainId = 6;
      const hubChainId = 5;

      const latestBlock = await ethers.provider.getBlock('latest');
      if (!latestBlock) {
        throw new Error('Failed to fetch the latest block');
      }

      const defaultAbiCoder = new ethers.AbiCoder();

      const message = defaultAbiCoder.encode(
        ['uint16', 'uint256', 'uint256', 'uint256', 'uint256'],
        [
          0,
          proposalId,
          latestBlock.timestamp + secondsPerBlock * 2,
          latestBlock.timestamp + secondsPerBlock * 2,
          latestBlock.timestamp + secondsPerBlock * 10,
        ]
      );

      const payload = defaultAbiCoder.encode(
        ['address', 'uint256', 'address', 'bytes'],
        [
          await daoSpoke.getAddress(),
          spokeChainId,
          await governor.getAddress(),
          message,
        ]
      );

      await callReceiveMessageWithWormholeMock(
        wormholeMockForDaoSpoke,
        await createMessageWithPayload(
          payload,
          hubChainId,
          await governor.getAddress()
        )
      );

      const proposal = await daoSpoke.proposals(proposalId);

      expect(proposal.proposalCreation).to.equal(
        latestBlock.timestamp + secondsPerBlock * 2
      );
      expect(proposal.localVoteStart).to.equal(
        latestBlock.timestamp + secondsPerBlock * 2
      );
      expect(proposal.localVoteEnd).to.equal(
        latestBlock.timestamp + secondsPerBlock * 10
      );
      expect(proposal.localVoteStartBlock).to.equal(latestBlock.number + 2);
    });

    it('should process message sending votes back to hub', async () => {
      const proposalId = await createProposalOnSpoke(
        daoSpoke,
        wormholeMockForDaoSpoke,
        1,
        await governor.getAddress()
      );

      const spokeChainId = 6;
      const hubChainId = 5;

      const defaultAbiCoder = new ethers.AbiCoder();

      const message = defaultAbiCoder.encode(
        ['uint16', 'uint256'],
        [1, proposalId]
      );

      const payload = defaultAbiCoder.encode(
        ['address', 'uint256', 'address', 'bytes'],
        [
          await daoSpoke.getAddress(),
          spokeChainId,
          await governor.getAddress(),
          message,
        ]
      );

      await callReceiveMessageWithWormholeMock(
        wormholeMockForDaoSpoke,
        await createMessageWithPayload(
          payload,
          hubChainId,
          await governor.getAddress()
        )
      );

      const proposal = await daoSpoke.proposals(proposalId);
      expect(proposal.voteFinished).to.be.true;
    });
  });

  describe('withdraw', () => {
    it('should withdraw as magistrate', async () => {
      await createProposalOnSpoke(
        daoSpoke,
        wormholeMockForDaoSpoke,
        1,
        await governor.getAddress()
      );

      const contractBalanceBefore = await ethers.provider.getBalance(
        await daoSpoke.getAddress()
      );
      const ownerBalanceBefore = await ethers.provider.getBalance(
        await owner.getAddress()
      );

      const txReceipt = await daoSpoke.connect(owner).withdrawFunds();
      const tx = await txReceipt.wait();

      if (!tx) {
        throw new Error('Failed to fetch the transaction receipt');
      }

      const contractBalanceAfter = await ethers.provider.getBalance(
        await daoSpoke.getAddress()
      );
      const ownerBalanceAfter = await ethers.provider.getBalance(
        await owner.getAddress()
      );

      expect(contractBalanceAfter).to.equal(0);
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(
        contractBalanceBefore - tx.gasUsed * tx.gasPrice
      );
    });

    it('should revert when not magistrate', async () => {
      await createProposalOnSpoke(
        daoSpoke,
        wormholeMockForDaoSpoke,
        1,
        await governor.getAddress()
      );

      await expect(daoSpoke.connect(user1).withdrawFunds()).to.be.revertedWith(
        'Magistrate: caller is not the magistrate'
      );
    });
  });
});
