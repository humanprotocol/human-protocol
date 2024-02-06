import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer, BigNumberish } from "ethers";
import {
  MetaHumanGovernor,
  VHMToken,
  HMToken,
  TimelockController,
  DAOSpokeContract,
  Governor,
  WormholeMock,
} from "../typechain-types";
import {
  createMockUserWithVotingPower,
  createBasicProposal,
  mineNBlocks,
  createProposalOnSpoke,
  finishProposal,
} from "./GovernanceUtils";

describe.only("DAOSpokeContract", function () {
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let user3: Signer;
  let wormholeMock: WormholeMock;
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
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy HMToken
    const HMToken = await ethers.getContractFactory(
      "contracts/HMToken.sol:HMToken",
    );
    token = (await HMToken.deploy(
      1000000000,
      "Human Token",
      18,
      "HMT",
    )) as HMToken;

    // Deploy VHMToken
    const VHMToken = await ethers.getContractFactory(
      "contracts/governance/vhm-token/VHMToken.sol:VHMToken",
    );
    voteToken = (await VHMToken.deploy(await token.getAddress())) as VHMToken;

    // Deposit vhmTokens
    await token.approve(voteToken.getAddress(), ethers.parseEther("5000000"));
    await voteToken.depositFor(
      owner.getAddress(),
      ethers.parseEther("5000000"),
    );

    // Deploy TimelockController
    proposers = [await owner.getAddress()];
    const TimelockController =
      await ethers.getContractFactory("TimelockController");
    timelockController = await TimelockController.deploy(
      1,
      proposers,
      executors,
      owner.getAddress(),
    );
    await timelockController.waitForDeployment();

    // Deploy WormholeMock
    const WormholeMock = await ethers.getContractFactory("WormholeMock");
    wormholeMock = await WormholeMock.deploy();

    // Send 1 ether to wormholeMock
    await owner.sendTransaction({
      to: await wormholeMock.getAddress(),
      value: ethers.parseEther("1"),
    });

    // Deploy MetaHumanGovernor
    const MetaHumanContract = await ethers.getContractFactory(
      "contracts/governance/MetaHumanGovernor.sol:MetaHumanGovernor",
    );
    governor = (await MetaHumanContract.deploy(
      voteToken.getAddress(),
      timelockController.getAddress(),
      [],
      5, // voting delay
      await wormholeMock.getAddress(),
      owner.getAddress(),
      12,
    )) as MetaHumanGovernor;

    // Deploy DAOSpokeContract
    const DAOSpokeContract = await ethers.getContractFactory(
      "contracts/governance/DAOSpokeContract.sol:DAOSpokeContract",
    );
    daoSpoke = (await DAOSpokeContract.deploy(
      ethers.zeroPadBytes(await governor.getAddress(), 32),
      5, // hubChainId
      voteToken.getAddress(),
      12, // voting period
      6, // spokeChainId
      await wormholeMock.getAddress(),
      owner.getAddress(), // admin address
    )) as DAOSpokeContract;

    // Set DAOSpokeContract on worm hole mock
    await wormholeMock.setDAOSpokeContract(await daoSpoke.getAddress());
  });

  it("should hasVoted return true when voted", async () => {
    const proposalId = await createProposalOnSpoke(
      daoSpoke,
      wormholeMock,
      1,
      await governor.getAddress(),
    );

    await createMockUserWithVotingPower(voteToken, user1);

    await mineNBlocks(3);

    await daoSpoke.connect(user1).castVote(proposalId, 0);
    const hasVoted = await daoSpoke.hasVoted(
      proposalId,
      await user1.getAddress(),
    );
    expect(hasVoted).to.be.true;
  });

  it("should hasVoted return false when hasn't voted", async () => {
    const proposalId = await createProposalOnSpoke(
      daoSpoke,
      wormholeMock,
      1,
      await governor.getAddress(),
    );

    await createMockUserWithVotingPower(voteToken, user1);

    await mineNBlocks(3);

    const hasVoted = await daoSpoke.hasVoted(
      proposalId,
      await user1.getAddress(),
    );

    expect(hasVoted).to.be.false;
  });

  it("should isProposal return false when proposal doesn't exist", async () => {
    const isProposal = await daoSpoke.isProposal(1);
    expect(isProposal).to.be.false;
  });

  it("should isProposal return true when proposal exists", async () => {
    const proposalId = await createProposalOnSpoke(
      daoSpoke,
      wormholeMock,
      1,
      await governor.getAddress(),
    );

    const isProposal = await daoSpoke.isProposal(proposalId);
    expect(isProposal).to.be.true;
  });

  it("should emit VoteCast event when user votes for", async () => {
    await createMockUserWithVotingPower(voteToken, user1);

    const proposalId = await createProposalOnSpoke(
      daoSpoke,
      wormholeMock,
      1,
      await governor.getAddress(),
    );

    await mineNBlocks(3);

    await expect(daoSpoke.connect(user1).castVote(proposalId, 0))
      .to.emit(daoSpoke, "VoteCast")
      .withArgs(
        await user1.getAddress(),
        proposalId,
        0,
        ethers.parseEther("1"),
        "",
      );
  });

  it("should emit VoteCast event when user votes against", async () => {
    await createMockUserWithVotingPower(voteToken, user1);

    const proposalId = await createProposalOnSpoke(
      daoSpoke,
      wormholeMock,
      1,
      await governor.getAddress(),
    );

    await mineNBlocks(3);

    await expect(daoSpoke.connect(user1).castVote(proposalId, 1))
      .to.emit(daoSpoke, "VoteCast")
      .withArgs(
        await user1.getAddress(),
        proposalId,
        1,
        ethers.parseEther("1"),
        "",
      );
  });

  it("should emit VoteCast event when user votes abstain", async () => {
    await createMockUserWithVotingPower(voteToken, user1);

    const proposalId = await createProposalOnSpoke(
      daoSpoke,
      wormholeMock,
      1,
      await governor.getAddress(),
    );

    await mineNBlocks(3);

    await expect(daoSpoke.connect(user1).castVote(proposalId, 2))
      .to.emit(daoSpoke, "VoteCast")
      .withArgs(
        await user1.getAddress(),
        proposalId,
        2,
        ethers.parseEther("1"),
        "",
      );
  });

  it("should revert when vote option is invalid", async () => {
    await createMockUserWithVotingPower(voteToken, user1);

    const proposalId = await createProposalOnSpoke(
      daoSpoke,
      wormholeMock,
      1,
      await governor.getAddress(),
    );

    await mineNBlocks(3);

    await expect(
      daoSpoke.connect(user1).castVote(proposalId, 3),
    ).to.be.revertedWith("DAOSpokeContract: invalid value for enum VoteType");
  });

  it("should revert when vote is finished", async () => {
    await createMockUserWithVotingPower(voteToken, user1);

    const proposalId = await createProposalOnSpoke(
      daoSpoke,
      wormholeMock,
      1,
      await governor.getAddress(),
    );

    await finishProposal(
      daoSpoke,
      wormholeMock,
      proposalId,
      await governor.getAddress(),
    );

    await expect(
      daoSpoke.connect(user1).castVote(proposalId, 0),
    ).to.be.revertedWith("DAOSpokeContract: vote finished");
  });
});
