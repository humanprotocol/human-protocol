import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { assert, expect } from 'chai';
import { Signer } from 'ethers';
import { ethers, upgrades } from 'hardhat';
import { EscrowFactory, HMToken, Staking } from '../typechain-types';

describe('EscrowFactory', function () {
  let owner: Signer,
    operator: Signer,
    reputationOracle: Signer,
    recordingOracle: Signer,
    trustedHandlers: string[];

  let token: HMToken, escrowFactory: EscrowFactory, staking: Staking;

  const minimumStake = 2;
  const lockPeriod = 2;

  const stakeAmount = 10;

  async function createEscrow() {
    const result = await (
      await escrowFactory
        .connect(operator)
        .createEscrow(token.address, trustedHandlers)
    ).wait();
    const event = result.events?.find(({ topics }) =>
      topics.includes(ethers.utils.id('Launched(address,address)'))
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
    const HMToken = await ethers.getContractFactory('HMToken');
    token = await HMToken.deploy(1000000000, 'Human Token', 18, 'HMT');

    // Send HMT tokens to the operator
    await token.connect(owner).transfer(await operator.getAddress(), 1000);
  });

  this.beforeEach(async () => {
    // Deploy Staking Conract
    const Staking = await ethers.getContractFactory('Staking');
    staking = (await upgrades.deployProxy(
      Staking,
      [token.address, minimumStake, lockPeriod],
      { kind: 'uups', initializer: 'initialize' }
    )) as Staking;

    // Approve spend HMT tokens staking contract
    await token.connect(operator).approve(staking.address, 1000);

    // Deploy Escrow Factory Contract
    const EscrowFactory = await ethers.getContractFactory('EscrowFactory');

    escrowFactory = (await upgrades.deployProxy(
      EscrowFactory,
      [staking.address],
      { kind: 'uups', initializer: 'initialize' }
    )) as EscrowFactory;
  });

  describe('deployment', () => {
    it('Should set the right counter', async () => {
      const initialCounter = await escrowFactory.counter();
      expect(initialCounter.toString()).to.equal('0');
    });
  });

  it('Operator should not be able to create an escrow without staking', async () => {
    await expect(
      escrowFactory
        .connect(operator)
        .createEscrow(token.address, [await reputationOracle.getAddress()])
    ).to.be.revertedWith('Needs to stake HMT tokens to create an escrow.');
  });

  it('Operator should be able to create an escrow after staking', async () => {
    const event = await stakeAndCreateEscrow(staking);

    expect(event?.token).to.equal(token.address, 'token address is correct');
    expect(event?.escrow).to.not.be.null;
  });

  it('Should emit an event on launched', async function () {
    await staking.connect(operator).stake(stakeAmount);

    await expect(
      escrowFactory
        .connect(operator)
        .createEscrow(token.address, trustedHandlers)
    )
      .to.emit(escrowFactory, 'Launched')
      .withArgs(token.address, anyValue);
  });

  it('Should find the newly created escrow from deployed escrow', async () => {
    await stakeAndCreateEscrow(staking);
    const escrowAddress = await escrowFactory.lastEscrow();

    const result = await escrowFactory
      .connect(operator)
      .hasEscrow(escrowAddress);
    expect(result).to.equal(true);
  });

  it('Operator should be able to create another escrow after allocating some of the stakes', async () => {
    const result = await stakeAndCreateEscrow(staking);
    const escrowAddress = result?.escrow;

    staking
      .connect(operator)
      .allocate(escrowAddress.toString(), stakeAmount / 2);

    const event = await createEscrow();

    expect(event?.token).to.equal(token.address, 'token address is correct');
    expect(event?.escrow).to.not.be.null;
  });

  it('Operator should not be able to create an escrow after allocating all of the stakes', async () => {
    const result = await stakeAndCreateEscrow(staking);
    const escrowAddress = result?.escrow;

    staking.connect(operator).allocate(escrowAddress.toString(), stakeAmount);

    await expect(
      escrowFactory
        .connect(operator)
        .createEscrow(token.address, [await reputationOracle.getAddress()])
    ).to.be.revertedWith('Needs to stake HMT tokens to create an escrow.');
  });

  it('Operator should be able to create an escrow after staking more tokens', async () => {
    const result = await stakeAndCreateEscrow(staking);
    const escrowAddress = result?.escrow;

    staking.connect(operator).allocate(escrowAddress.toString(), stakeAmount);

    const event = await stakeAndCreateEscrow(staking);

    expect(event?.token).to.equal(token.address, 'token address is correct');
    expect(event?.escrow).to.not.be.null;
  });

  describe('proxy implementation', function () {
    it('Should reject non-owner upgrades', async () => {
      const EscrowFactoryV0 = await ethers.getContractFactory(
        'EscrowFactoryV0',
        operator
      );

      await expect(
        upgrades.upgradeProxy(escrowFactory.address, EscrowFactoryV0)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Owner should upgrade correctly', async () => {
      const EscrowFactoryV0 = await ethers.getContractFactory(
        'EscrowFactoryV0'
      );
      const oldImplementationAddress =
        await upgrades.erc1967.getImplementationAddress(escrowFactory.address);

      await upgrades.upgradeProxy(escrowFactory.address, EscrowFactoryV0);

      expect(
        await upgrades.erc1967.getImplementationAddress(escrowFactory.address)
      ).to.not.be.equal(oldImplementationAddress);

      const event = await stakeAndCreateEscrow(staking);

      expect(event?.token).to.equal(token.address, 'token address is correct');
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
        await upgrades.erc1967.getImplementationAddress(escrowFactory.address);

      const EscrowFactoryV0 = await ethers.getContractFactory(
        'EscrowFactoryV0'
      );
      await upgrades.upgradeProxy(escrowFactory.address, EscrowFactoryV0);

      expect(
        await upgrades.erc1967.getImplementationAddress(escrowFactory.address)
      ).to.not.be.equal(oldImplementationAddress);

      expect(await escrowFactory.lastEscrow()).to.equal(oldLastEscrow);
    });
  });
});
