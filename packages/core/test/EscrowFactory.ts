import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import { EscrowFactory, HMToken, Staking } from '../typechain-types';

describe('EscrowFactory', function () {
  enum Role {
    Operator = 1,
  }

  let owner: Signer,
    operator: Signer,
    fakeStaking: Signer,
    reputationOracle: Signer,
    recordingOracle: Signer,
    trustedHandlers: string[];

  let token: HMToken, escrowFactory: EscrowFactory;

  const stakeAmount = 10;

  async function createEscrow() {
    const result = await (
      await escrowFactory.connect(operator).createEscrow(trustedHandlers)
    ).wait();
    const event = result.events?.[0].args;

    return event;
  }

  async function stakeAndCreateEscrow(staking: Staking) {
    await staking
      .connect(owner)
      .setStaker(await operator.getAddress(), Role.Operator);
    await staking.connect(operator).stake(stakeAmount);

    return await createEscrow();
  }

  beforeEach(async () => {
    [owner, operator, fakeStaking, reputationOracle, recordingOracle] =
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

    // Deploy Escrow Factory Contract
    const EscrowFactory = await ethers.getContractFactory('EscrowFactory');

    escrowFactory = await EscrowFactory.deploy(token.address);
  });

  describe('deployment', () => {
    it('Should set owner', async () => {
      expect(await escrowFactory.owner()).to.equal(await owner.getAddress());
    });

    it('Should set the right token address', async () => {
      const result = await escrowFactory.eip20();
      expect(result).to.equal(token.address);
    });

    it('Should set the right counter', async () => {
      const initialCounter = await escrowFactory.counter();
      expect(initialCounter.toString()).to.equal('0');
    });
  });

  describe('Without staking contract', () => {
    it('Operator should not be able to create an escrow', async () => {
      await expect(
        escrowFactory
          .connect(operator)
          .createEscrow([ethers.constants.AddressZero])
      ).to.be.revertedWith('Staking is not configured');
    });
  });

  describe('With staking contract', () => {
    const minimumStake = 2;
    const lockPeriod = 2;

    let staking: Staking;

    beforeEach(async () => {
      // Deploy Staking Conract
      const Staking = await ethers.getContractFactory('Staking');
      staking = await Staking.deploy(
        token.address,
        escrowFactory.address,
        minimumStake,
        lockPeriod
      );

      // Approve spend HMT tokens staking contract
      await token.connect(operator).approve(staking.address, 1000);
    });

    describe('Configure staking', async () => {
      it('Only owner can set staking', async () => {
        await expect(
          escrowFactory
            .connect(operator)
            .setStaking(await fakeStaking.getAddress())
        ).to.be.revertedWith('Caller is not owner');
      });

      it('Owner can set staking', async () => {
        await escrowFactory.setStaking(staking.address);

        expect(await escrowFactory.staking()).to.equal(staking.address);
      });

      it("Staking can't be modified", async () => {
        await escrowFactory.setStaking(staking.address);

        expect(await escrowFactory.staking()).to.equal(staking.address);

        await expect(
          escrowFactory.setStaking(await fakeStaking.getAddress())
        ).to.be.revertedWith('Staking already set');
      });
    });

    describe('After staking is configured', async () => {
      beforeEach(async () => {
        // Configure Staking in EscrowFactory
        await escrowFactory.setStaking(staking.address);
      });

      it('Operator should not be able to create an escrow without staking', async () => {
        await expect(
          escrowFactory
            .connect(operator)
            .createEscrow([ethers.constants.AddressZero])
        ).to.be.revertedWith('Needs to stake HMT tokens to create an escrow.');
      });

      it('Operator should be able to create an escrow after staking', async () => {
        const event = await stakeAndCreateEscrow(staking);

        expect(event?.eip20).to.equal(
          token.address,
          'token address is correct'
        );
        expect(event?.escrow).to.not.be.null;
        expect(event?.counter.toString()).to.equal('1', 'counter is correct');
      });

      it('Should emit an event on launched', async function () {
        await staking
          .connect(owner)
          .setStaker(await operator.getAddress(), Role.Operator);
        await staking.connect(operator).stake(stakeAmount);

        await expect(
          escrowFactory.connect(operator).createEscrow(trustedHandlers)
        )
          .to.emit(escrowFactory, 'Launched')
          .withArgs(token.address, anyValue, 1);
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

        expect(event?.eip20).to.equal(
          token.address,
          'token address is correct'
        );
        expect(event?.escrow).to.not.be.null;
        expect(event?.counter.toString()).to.equal('2', 'counter is correct');
      });

      it('Operator should not be able to create an escrow after allocating all of the stakes', async () => {
        const result = await stakeAndCreateEscrow(staking);
        const escrowAddress = result?.escrow;

        staking
          .connect(operator)
          .allocate(escrowAddress.toString(), stakeAmount);

        await expect(
          escrowFactory
            .connect(operator)
            .createEscrow([ethers.constants.AddressZero])
        ).to.be.revertedWith('Needs to stake HMT tokens to create an escrow.');
      });

      it('Operator should be able to create an escrow after staking more tokens', async () => {
        const result = await stakeAndCreateEscrow(staking);
        const escrowAddress = result?.escrow;

        staking
          .connect(operator)
          .allocate(escrowAddress.toString(), stakeAmount);

        const event = await stakeAndCreateEscrow(staking);

        expect(event?.eip20).to.equal(
          token.address,
          'token address is correct'
        );
        expect(event?.escrow).to.not.be.null;
        expect(event?.counter.toString()).to.equal('2', 'counter is correct');
      });
    });
  });
});
