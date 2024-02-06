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
} from './GovernanceUtils';

describe('MetaHumanGovernor', function () {
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let user3: Signer;
  let proposers: string[];
  const executors: string[] = [ethers.ZeroAddress];
  let governor: MetaHumanGovernor;
  let governance: Governor;
  let voteToken: VHMToken;
  let token: HMToken;
  let timelockController: TimelockController;
  let daoSpoke: DAOSpokeContract;
  let newDAOSpoke: DAOSpokeContract;

  this.beforeEach(async () => {
    [owner, user1, user2, user3] = await ethers.getSigners();

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
      '0x0591C25ebd0580E0d4F27A82Fc2e24E7489CB5e0',
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

  it('Should create a grant proposal', async function () {
    // const proposalId = await createBasicProposal(voteToken, governor, owner);
    // expect(proposalId).to.equal(0);
  });

  it('Should create a cross-chain grant proposal successfully', async function () {
    const encodedCall = voteToken.interface.encodeFunctionData('transfer', [
      await owner.getAddress(),
      50,
    ]);

    const targets = [await voteToken.getAddress()];
    const values: BigNumberish[] = [0];
    const calldatas = [encodedCall];

    const tx = await governor.crossChainPropose(targets, values, calldatas, '');
    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error('No receipt');
    }
    expect(receipt.status).to.equal(1);
    await expect(tx.wait()).to.not.be.reverted;
  });

  it('Should allow cross-chain propose when spokes are empty', async function () {
    await governor.updateSpokeContracts([]);

    const encodedCall = voteToken.interface.encodeFunctionData('transfer', [
      await owner.getAddress(),
      50,
    ]);
    const targets = [voteToken.getAddress()];
    const values: BigNumberish[] = [0];
    const calldatas = [encodedCall];

    const tx = await governor.crossChainPropose(
      targets,
      values,
      calldatas,
      'Sample proposal with empty spokes'
    );
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error('No receipt');
    }
    expect(receipt.status).to.equal(
      1,
      'The transaction should be successful even when spokes are empty'
    );
    await expect(tx.wait()).to.not.be.reverted;
  });

  it('Should allow voting on a proposal', async function () {
    const proposalId = await createBasicProposal(
      voteToken,
      governor,
      governance,
      owner
    );
    const someUser = await createMockUserWithVotingPower(voteToken, user1);
    // Mine 2 blocks

    await mineNBlocks(2);
    // Cast vote
    await governor.connect(someUser).castVote(proposalId, 1);

    const { againstVotes, forVotes, abstainVotes } =
      await governor.proposalVotes(proposalId);
    console.log('Against votes:', againstVotes.toString());
    console.log('For votes:', forVotes.toString());
    console.log('Abstain votes:', abstainVotes.toString());

    expect(againstVotes).to.equal(0);
    expect(forVotes).to.equal(1);
    expect(abstainVotes).to.equal(0);
  });

  it('Should revert when voting on a non-active proposal', async function () {
    const proposalId = await createBasicProposal(voteToken, governor, owner);
    const someUser = await createMockUserWithVotingPower(voteToken, user1);
    await expect(
      governor.connect(someUser).castVote(proposalId, 1)
    ).to.be.revertedWith('Governor: vote not currently active');
  });

  it('Should allow voting against', async function () {
    const proposalId = await createBasicProposal(voteToken, governor, owner);
    const someUser = await createMockUserWithVotingPower(voteToken, user1);
    await mineNBlocks(2);
    await governor.connect(someUser).castVote(proposalId, 0);
    const { againstVotes, forVotes, abstainVotes } =
      await governor.proposalVotes(proposalId);
    expect(againstVotes).to.equal(1);
    expect(forVotes).to.equal(0);
    expect(abstainVotes).to.equal(0);
  });

  it('Should allow voting abstain', async function () {
    const proposalId = await createBasicProposal(voteToken, governor, owner);
    const someUser = await createMockUserWithVotingPower(voteToken, user1);
    await mineNBlocks(2);
    await governor.connect(someUser).castVote(proposalId, 2);
    const { againstVotes, forVotes, abstainVotes } =
      await governor.proposalVotes(proposalId);
    expect(againstVotes).to.equal(0);
    expect(forVotes).to.equal(0);
    expect(abstainVotes).to.equal(1);
  });

  it('Should revert when voting with invalid option', async function () {
    const proposalId = await createBasicProposal(voteToken, governor, owner);
    const someUser = await createMockUserWithVotingPower(voteToken, user1);
    await mineNBlocks(2);
    await expect(
      governor.connect(someUser).castVote(proposalId, 5)
    ).to.be.revertedWith(
      'GovernorVotingSimple: invalid value for enum VoteType'
    );
  });

  it('Should revert when vote already cast', async function () {
    const proposalId = await createBasicProposal(voteToken, governor, owner);
    const someUser = await createMockUserWithVotingPower(voteToken, user1);
    await mineNBlocks(2);
    await governor.connect(someUser).castVote(proposalId, 1);
    await expect(
      governor.connect(someUser).castVote(proposalId, 1)
    ).to.be.revertedWith('GovernorVotingSimple: vote already cast');
  });

  it('Should retrieve counting mode', async function () {
    const countingMode = await governor.COUNTING_MODE();
    expect(countingMode).to.equal('support=bravo&quorum=for,abstain');
  });

  it('Should not count vote when vote not cast', async function () {
    const proposalId = await createBasicProposal(voteToken, governor, owner);
    const someUser = await createMockUserWithVotingPower(voteToken, user1);
    const hasVoted = await governor.hasVoted(
      proposalId,
      await someUser.getAddress()
    );
    expect(hasVoted).to.be.false;
  });

  it('Should count vote when vote cast', async function () {
    const proposalId = await createBasicProposal(voteToken, governor, owner);
    const someUser = await createMockUserWithVotingPower(voteToken, user1);
    await mineNBlocks(2);
    await governor.connect(someUser).castVote(proposalId, 1);
    const hasVoted = await governor.hasVoted(
      proposalId,
      await someUser.getAddress()
    );
    expect(hasVoted).to.be.true;
  });
});
