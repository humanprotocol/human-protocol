import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { assert, expect } from 'chai';
import { EventLog, Signer } from 'ethers';
import { ethers, upgrades } from 'hardhat';
import { EscrowFactory, HMToken, Staking } from '../typechain-types';

describe('EscrowFactory', function () {
  let owner: Signer,
    operator: Signer,
    reputationOracle: Signer,
    recordingOracle: Signer,
    trustedHandlers: string[];

  let token: HMToken, escrowFactory: EscrowFactory, staking: Staking;

  const jobRequesterId = 'job-requester-id';
  const minimumStake = 5;
  const lockPeriod = 2;
  const feePercentage = 2;

  const stakeAmount = 10;

  async function createEscrow() {
    const result = await (
      await escrowFactory
        .connect(operator)
        .createEscrow(await token.getAddress(), trustedHandlers, jobRequesterId)
    ).wait();
    const event = (
      result?.logs?.find(({ topics }) =>
        topics.includes(ethers.id('LaunchedV2(address,address,string)'))
      ) as EventLog
    )?.args;

    return event;
  }

  async function stakeAndCreateEscrow(staking: Staking) {
    await staking.connect(operator).stake(stakeAmount);

    return await createEscrow();
  }

  this.beforeAll(async () => {
    [owner, operator, reputationOracle, recordingOracle] =
      await ethers.getSigners();

    trustedHandlers = [
      await reputationOracle.getAddress(),
      await recordingOracle.getAddress(),
    ];

    // Deploy HMToken Contract
    const HMToken = await ethers.getContractFactory(
      'contracts/HMToken.sol:HMToken'
    );
    token = (await HMToken.deploy(
      1000000000,
      'Human Token',
      18,
      'HMT'
    )) as HMToken;

    // Send HMT tokens to the operator
    await token.connect(owner).transfer(await operator.getAddress(), 1000);
  });

  this.beforeEach(async () => {
    // Deploy Staking Contract
    const Staking = await ethers.getContractFactory('Staking');
    staking = await Staking.deploy(
      await token.getAddress(),
      minimumStake,
      lockPeriod,
      feePercentage
    );

    // Approve spend HMT tokens staking contract
    await token.connect(operator).approve(await staking.getAddress(), 1000);

    // Deploy Escrow Factory Contract
    const EscrowFactory = await ethers.getContractFactory(
      'contracts/EscrowFactory.sol:EscrowFactory'
    );

    escrowFactory = (await upgrades.deployProxy(
      EscrowFactory,
      [await staking.getAddress(), minimumStake],
      { kind: 'uups', initializer: 'initialize' }
    )) as unknown as EscrowFactory;
  });

  describe('deployment', () => {
    it('Should set the right counter', async () => {
      const initialCounter = await escrowFactory.counter();
      expect(initialCounter.toString()).to.equal('0');
    });
  });

  it('Operator should not be able to create an escrow without meeting minimum stake', async () => {
    await expect(
      escrowFactory
        .connect(operator)
        .createEscrow(
          await token.getAddress(),
          [await reputationOracle.getAddress()],
          jobRequesterId
        )
    ).to.be.revertedWith('Insufficient stake to create an escrow.');
  });

  it('Operator should be able to create an escrow after meeting minimum stake', async () => {
    const event = await stakeAndCreateEscrow(staking);

    expect(event?.token).to.equal(
      await token.getAddress(),
      'token address is correct'
    );
    expect(event?.escrow).to.not.be.null;
  });

  it('Should emit an event on launched', async function () {
    await staking.connect(operator).stake(stakeAmount);

    await expect(
      escrowFactory
        .connect(operator)
        .createEscrow(await token.getAddress(), trustedHandlers, jobRequesterId)
    )
      .to.emit(escrowFactory, 'LaunchedV2')
      .withArgs(await token.getAddress(), anyValue, jobRequesterId);
  });

  it('Owner should be able to set minimumStake', async () => {
    await escrowFactory.connect(owner).setMinimumStake(15);
    const minimumStake = await escrowFactory.minimumStake();
    expect(minimumStake).to.equal(15, 'Minimum stake updated correctly');
  });

  it('Owner should be able to modify staking address', async () => {
    const Staking = await ethers.getContractFactory('Staking');
    const newStaking = await Staking.deploy(
      await token.getAddress(),
      minimumStake,
      lockPeriod,
      feePercentage
    );
    await escrowFactory
      .connect(owner)
      .setStakingAddress(await newStaking.getAddress());
    const newStakingAddress = await escrowFactory.staking();
    expect(newStakingAddress).to.equal(
      await newStaking.getAddress(),
      'Staking address updated correctly'
    );
    expect(newStakingAddress).not.to.equal(
      await staking.getAddress(),
      'Staking address is different to the previous one'
    );
  });

  it('Operator should not create escrow if new minimumStake is not met', async () => {
    await escrowFactory.connect(owner).setMinimumStake(15);
    await staking.connect(operator).stake(stakeAmount);

    await expect(
      escrowFactory
        .connect(operator)
        .createEscrow(
          await token.getAddress(),
          [await reputationOracle.getAddress()],
          jobRequesterId
        )
    ).to.be.revertedWith('Insufficient stake to create an escrow.');
  });

  it('Operator should be able to create escrow after staking more to meet new minimum', async () => {
    await escrowFactory.connect(owner).setMinimumStake(15);
    await staking.connect(operator).stake(20);

    const event = await createEscrow();

    expect(event?.token).to.equal(
      await token.getAddress(),
      'token address is correct'
    );
    expect(event?.escrow).to.not.be.null;
  });

  it('Should find the newly created escrow from deployed escrow', async () => {
    await stakeAndCreateEscrow(staking);
    const escrowAddress = await escrowFactory.lastEscrow();

    const result = await escrowFactory
      .connect(operator)
      .hasEscrow(escrowAddress);
    expect(result).to.equal(true);
  });

  it('Operator should be able to create another escrow after unstaking some of the stakes', async () => {
    await stakeAndCreateEscrow(staking);

    staking.connect(operator).unstake(2);

    const event = await createEscrow();

    expect(event?.token).to.equal(
      await token.getAddress(),
      'token address is correct'
    );
    expect(event?.escrow).to.not.be.null;
  });

  it('Operator should not be able to create an escrow after unstaking all of the stakes', async () => {
    await stakeAndCreateEscrow(staking);

    staking.connect(operator).unstake(stakeAmount);

    await expect(
      escrowFactory
        .connect(operator)
        .createEscrow(
          await token.getAddress(),
          [await reputationOracle.getAddress()],
          jobRequesterId
        )
    ).to.be.revertedWith('Insufficient stake to create an escrow.');
  });

  it('Should find the newly created escrow from deployed escrow', async () => {
    await stakeAndCreateEscrow(staking);
    const escrowAddress = await escrowFactory.lastEscrow();

    const result = await escrowFactory
      .connect(operator)
      .hasEscrow(escrowAddress);
    expect(result).to.equal(true);
  });

  describe('proxy implementation', function () {
    it('Should reject non-owner upgrades', async () => {
      const EscrowFactoryV0 = await ethers.getContractFactory(
        'EscrowFactoryV0',
        operator
      );

      await expect(
        upgrades.upgradeProxy(await escrowFactory.getAddress(), EscrowFactoryV0)
      )
        .to.be.revertedWithCustomError(staking, 'OwnableUnauthorizedAccount')
        .withArgs(await operator.getAddress());
    });

    it('Owner should upgrade correctly', async () => {
      const EscrowFactoryV0 =
        await ethers.getContractFactory('EscrowFactoryV0');
      const oldImplementationAddress =
        await upgrades.erc1967.getImplementationAddress(
          await escrowFactory.getAddress()
        );

      await upgrades.upgradeProxy(
        await escrowFactory.getAddress(),
        EscrowFactoryV0
      );

      expect(
        await upgrades.erc1967.getImplementationAddress(
          await escrowFactory.getAddress()
        )
      ).to.not.be.equal(oldImplementationAddress);

      const event = await stakeAndCreateEscrow(staking);

      expect(event?.token).to.equal(
        await token.getAddress(),
        'token address is correct'
      );
      expect(event?.escrow).to.not.be.null;

      try {
        escrowFactory.hasEscrow(owner.getAddress());
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        assert(
          error.message === 'newEscrowFactory.hasEscrow is not a function'
        );
      }
    });

    it('Should have the same storage', async () => {
      await stakeAndCreateEscrow(staking);

      const oldLastEscrow = await escrowFactory.lastEscrow();
      const oldImplementationAddress =
        await upgrades.erc1967.getImplementationAddress(
          await escrowFactory.getAddress()
        );

      const EscrowFactoryV0 =
        await ethers.getContractFactory('EscrowFactoryV0');
      await upgrades.upgradeProxy(
        await escrowFactory.getAddress(),
        EscrowFactoryV0
      );

      expect(
        await upgrades.erc1967.getImplementationAddress(
          await escrowFactory.getAddress()
        )
      ).to.not.be.equal(oldImplementationAddress);

      expect(await escrowFactory.lastEscrow()).to.equal(oldLastEscrow);
    });
  });
});
