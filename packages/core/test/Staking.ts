import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import {
  EscrowFactory,
  HMToken,
  Staking,
  RewardPool,
} from '../typechain-types';

const mineNBlocks = async (n: number) => {
  await Promise.all(
    Array(n)
      .fill(0)
      .map(async () => {
        await ethers.provider.send('evm_mine', []);
      })
  );
};

describe('Staking', function () {
  enum Role {
    Null = 0,
    Operator = 1,
    Validator = 2,
    ExchangeOracle = 3,
    ReputationOracle = 4,
    RecordingOracle = 5,
  }

  const minimumStake = 2;
  const lockPeriod = 2;
  const rewardFee = 1;

  let owner: Signer,
    validator: Signer,
    operator: Signer,
    operator2: Signer,
    operator3: Signer,
    exchangeOracle: Signer,
    reputationOracle: Signer,
    recordingOracle: Signer;

  let token: HMToken,
    escrowFactory: EscrowFactory,
    staking: Staking,
    rewardPool: RewardPool;

  this.beforeEach(async () => {
    [
      owner,
      validator,
      operator,
      operator2,
      operator3,
      exchangeOracle,
      reputationOracle,
      recordingOracle,
    ] = await ethers.getSigners();

    // Deploy HMTToken Contract
    const HMToken = await ethers.getContractFactory('HMToken');
    token = await HMToken.deploy(1000000000, 'Human Token', 18, 'HMT');

    // Send HMT tokens to contract participants
    await Promise.all(
      [
        validator,
        operator,
        operator2,
        operator3,
        exchangeOracle,
        reputationOracle,
        recordingOracle,
      ].map(async (account) => {
        await token.connect(owner).approve(await account.getAddress(), 1000);
        await token
          .connect(account)
          .transferFrom(
            await owner.getAddress(),
            await account.getAddress(),
            1000
          );
      })
    );

    // Deploy Escrow Factory Contract
    const EscrowFactory = await ethers.getContractFactory('EscrowFactory');

    escrowFactory = await EscrowFactory.deploy(token.address);

    // Deploy Staking Conract
    const Staking = await ethers.getContractFactory('Staking');
    staking = await Staking.deploy(
      token.address,
      escrowFactory.address,
      minimumStake,
      lockPeriod
    );

    // Deploy Reward Pool Conract
    const RewardPool = await ethers.getContractFactory('RewardPool');
    rewardPool = await RewardPool.deploy(
      token.address,
      staking.address,
      rewardFee
    );

    // Configure Staking in EscrowFactory
    await escrowFactory.setStaking(staking.address);

    // Topup staking address
    await token.connect(owner).transfer(staking.address, 1000);

    // Approve spend HMT tokens staking contract
    [
      validator,
      operator,
      operator2,
      operator3,
      exchangeOracle,
      reputationOracle,
      recordingOracle,
    ].map(async (account) => {
      await token.connect(account).approve(staking.address, 1000);
    });
  });

  describe('deployment', () => {
    it('Should set the right token address', async () => {
      const result = await staking.eip20();
      expect(result).to.equal(token.address);
    });

    it('Should set the right escrow factory address', async () => {
      const result = await staking.escrowFactory();
      expect(result).to.equal(escrowFactory.address);
    });

    it('Should set the minimum stake', async () => {
      const result = await staking.minimumStake();
      expect(result.toString()).to.equal(minimumStake.toString());
    });

    it('Should set the right lock period', async () => {
      const result = await staking.lockPeriod();
      expect(result.toString()).to.equal(lockPeriod.toString());
    });
  });

  describe('setStaker', function () {
    describe('Validations', function () {
      it('Should revert with the right error if caller is not an owner', async function () {
        await expect(
          staking
            .connect(operator)
            .setStaker(ethers.constants.AddressZero, Role.Operator)
        ).to.be.revertedWith('Caller is not a owner');
      });

      it('Should revert with the right error if invalid address', async function () {
        await expect(
          staking
            .connect(owner)
            .setStaker(ethers.constants.AddressZero, Role.Operator)
        ).to.be.revertedWith('Must be a valid address');
      });

      it('Should revert with the right error if called want setup himself', async function () {
        await expect(
          staking
            .connect(owner)
            .setStaker(await owner.getAddress(), Role.Operator)
        ).to.be.revertedWith('Staker cannot set himself');
      });
    });

    describe('Events', function () {
      it('Should emit an event on set staker', async function () {
        await expect(
          staking
            .connect(owner)
            .setStaker(await operator2.getAddress(), Role.Operator)
        )
          .to.emit(staking, 'SetStaker')
          .withArgs(await operator2.getAddress(), anyValue);
      });
    });

    describe('Set address as staker', function () {
      it('Should set address as a staker with role', async function () {
        await staking
          .connect(owner)
          .setStaker(await operator3.getAddress(), Role.Operator);
        await expect(
          await staking
            .connect(owner)
            .isRole(await operator3.getAddress(), Role.Operator)
        ).to.equal(true);
      });
    });
  });

  describe('stake', function () {
    this.beforeEach(async () => {
      await staking
        .connect(owner)
        .setStaker(await operator.getAddress(), Role.Operator);
    });

    describe('Validations', function () {
      it('Should revert with the right error if not a positive number', async function () {
        await expect(staking.connect(operator).stake(0)).to.be.revertedWith(
          'Must be a positive number'
        );
      });

      it('Should revert with the right error if total stake is below the minimum threshold', async function () {
        await expect(staking.connect(operator).stake(1)).to.be.revertedWith(
          'Total stake is below the minimum threshold'
        );
      });
    });

    describe('Events', function () {
      it('Should emit an event on stake deposited', async function () {
        await token.connect(operator).approve(staking.address, 100); //!

        await expect(await staking.connect(operator).stake(2))
          .to.emit(staking, 'StakeDeposited')
          .withArgs(await operator.getAddress(), anyValue);
      });
    });

    describe('Stake tokens', function () {
      it('Should stake token and increase staker stake', async function () {
        await staking.connect(operator).stake(2);
        await expect(
          await staking.connect(operator).hasStake(await operator.getAddress())
        ).to.equal(true);
      });
    });
  });

  describe('unstake', function () {
    this.beforeEach(async () => {
      const amount = 10;

      await staking
        .connect(owner)
        .setStaker(await operator.getAddress(), Role.Operator);
      await staking.connect(operator).stake(amount);
    });

    describe('Validations', function () {
      it('Should revert with the right error if not a positive number', async function () {
        const amount = 0;

        await expect(
          staking.connect(operator).unstake(amount)
        ).to.be.revertedWith('Must be a positive number');
      });

      it('Should revert with the right error if total stake is below the minimum threshold', async function () {
        const amount = 9;

        await expect(
          staking.connect(operator).unstake(amount)
        ).to.be.revertedWith('Total stake is below the minimum threshold');
      });
    });

    describe('Events', function () {
      it('Should emit an event on stake locked', async function () {
        const amount = 5;

        await expect(await staking.connect(operator).unstake(amount))
          .to.emit(staking, 'StakeLocked')
          .withArgs(await operator.getAddress(), anyValue, anyValue);
      });
    });

    describe('Unstake tokens', function () {
      it('Should lock tokens for withdrawal', async function () {
        const amount = 5;

        await staking.connect(operator).unstake(amount);
        const staker = await staking
          .connect(operator)
          .getStaker(await operator.getAddress());
        await expect(staker.tokensLocked).to.equal(amount.toString());
        await expect(staker.tokensLockedUntil).to.not.equal('0');
      });
    });
  });

  describe('allocate', function () {
    let escrowAddress: string;

    this.beforeEach(async () => {
      const amount = 10;

      await staking
        .connect(owner)
        .setStaker(await operator.getAddress(), Role.Operator);
      await staking.connect(operator).stake(amount);

      const result = await (
        await escrowFactory
          .connect(operator)
          .createEscrow([ethers.constants.AddressZero])
      ).wait();
      const event = result.events?.[0].args;

      expect(event?.eip20).to.equal(token.address, 'token address is correct');
      expect(event?.escrow).to.not.be.null;
      expect(event?.counter.toString()).to.equal('1', 'counter is correct');

      escrowAddress = event?.escrow;
    });

    describe('Validations', function () {
      it('Should revert with the right error if not a valid address', async function () {
        const amount = 5;

        await expect(
          staking
            .connect(operator)
            .allocate(ethers.constants.AddressZero, amount)
        ).to.be.revertedWith('Must be a valid address');
      });

      it('Should revert with the right error if not an insufficient amount of tokens in the stake', async function () {
        const amount = 20;
        await expect(
          staking.connect(operator).allocate(escrowAddress.toString(), amount)
        ).to.be.revertedWith('Insufficient amount of tokens in the stake');
      });

      it('Should revert with the right error if not a positive number', async function () {
        const amount = 0;

        await expect(
          staking.connect(operator).allocate(escrowAddress.toString(), amount)
        ).to.be.revertedWith('Must be a positive number');
      });

      it('Should revert with the right error if allocation already exists', async function () {
        const amount = 3;

        await staking
          .connect(operator)
          .allocate(escrowAddress.toString(), amount);

        await expect(
          staking.connect(operator).allocate(escrowAddress.toString(), amount)
        ).to.be.revertedWith('Allocation already exists');
      });
    });

    describe('Events', function () {
      it('Should emit an event on stake allocated', async function () {
        const amount = 5;

        await expect(
          await staking
            .connect(operator)
            .allocate(escrowAddress.toString(), amount)
        )
          .to.emit(staking, 'StakeAllocated')
          .withArgs(
            await operator.getAddress(),
            amount,
            escrowAddress.toString(),
            anyValue
          );
      });
    });

    describe('Allocate tokens', function () {
      it('Should allocate tokens to allocation', async function () {
        const amount = 5;

        await staking
          .connect(operator)
          .allocate(escrowAddress.toString(), amount);
        const allocation = await staking
          .connect(operator)
          .getAllocation(escrowAddress.toString());

        await expect(allocation.escrowAddress).to.equal(
          escrowAddress.toString()
        );
        await expect(allocation.tokens).to.equal(amount.toString());
      });
    });
  });

  describe('withdraw', function () {
    this.beforeEach(async () => {
      const stakeTokens = 10;

      await staking
        .connect(owner)
        .setStaker(await operator.getAddress(), Role.Operator);
      await staking.connect(operator).stake(stakeTokens);

      const result = await (
        await escrowFactory
          .connect(operator)
          .createEscrow([ethers.constants.AddressZero])
      ).wait();
      const event = result.events?.[0].args;

      expect(event?.eip20).to.equal(token.address, 'token address is correct');
      expect(event?.escrow).to.not.be.null;
      expect(event?.counter.toString()).to.equal('1', 'counter is correct');
    });

    describe('Withdrawal without allocation', function () {
      describe('Validations', function () {
        it('Should revert with the right error if has no available tokens for withdrawal', async function () {
          await expect(staking.connect(operator).withdraw()).to.be.revertedWith(
            'Stake has no available tokens for withdrawal'
          );
        });
      });

      describe('Events', function () {
        it('Should emit an event on stake withdrawn', async function () {
          const lockedTokens = 5;
          await staking.connect(operator).unstake(lockedTokens);

          const stakeTokens = 10;
          await staking.connect(operator).stake(stakeTokens);

          await expect(await staking.connect(operator).withdraw())
            .to.emit(staking, 'StakeWithdrawn')
            .withArgs(await operator.getAddress(), anyValue);
        });
      });

      describe('Withdraw tokens', function () {
        it('Should decrease amount of tokens from tokens staked', async function () {
          const restTokensStaked = 5;
          const lockedTokens = 5;

          await staking.connect(operator).unstake(lockedTokens);

          const staker = await staking
            .connect(operator)
            .getStaker(await operator.getAddress());

          let latestBlockNumber = await ethers.provider.getBlockNumber();
          expect(latestBlockNumber).to.be.lessThan(staker.tokensLockedUntil);

          // Mine N blocks to get through the locking period
          await mineNBlocks(lockPeriod);

          latestBlockNumber = await ethers.provider.getBlockNumber();
          expect(staker.tokensLockedUntil).to.lessThanOrEqual(
            latestBlockNumber
          );

          await staking.connect(operator).withdraw();
          const stakerAfterWithdrawn = await staking
            .connect(operator)
            .getStaker(await operator.getAddress());

          await expect(stakerAfterWithdrawn.tokensStaked).to.equal(
            restTokensStaked.toString()
          );
          await expect(stakerAfterWithdrawn.tokensLocked).to.equal('0');
          await expect(stakerAfterWithdrawn.tokensLockedUntil).to.equal('0');
        });
      });
    });
  });

  describe('setMinimumStake', function () {
    describe('Validations', function () {
      it('Should revert with the right error if caller is not an owner', async function () {
        const minumumStake = 0;

        await expect(
          staking.connect(operator).setMinimumStake(minumumStake)
        ).to.be.revertedWith('Caller is not a owner');
      });

      it('Should revert with the right error if not a positive number', async function () {
        const minumumStake = 0;

        await expect(
          staking.connect(owner).setMinimumStake(minumumStake)
        ).to.be.revertedWith('Must be a positive number');
      });
    });

    describe('Events', function () {
      it('Should emit an event on stake locked', async function () {
        const minumumStake = 5;

        await expect(await staking.connect(owner).setMinimumStake(minumumStake))
          .to.emit(staking, 'SetMinumumStake')
          .withArgs(minumumStake);
      });
    });

    describe('Set minimum stake', function () {
      it('Should assign a value to minimum stake variable', async function () {
        const minumumStake = 5;

        await staking.connect(owner).setMinimumStake(minumumStake);
        await expect(await staking.minimumStake()).to.equal(minumumStake);
      });
    });
  });

  describe('setLockPeriod', function () {
    describe('Validations', function () {
      it('Should revert with the right error if caller is not an owner', async function () {
        const lockPeriod = 0;

        await expect(
          staking.connect(operator).setLockPeriod(lockPeriod)
        ).to.be.revertedWith('Caller is not a owner');
      });

      it('Should revert with the right error if not a positive number', async function () {
        const lockPeriod = 0;

        await expect(
          staking.connect(owner).setLockPeriod(lockPeriod)
        ).to.be.revertedWith('Must be a positive number');
      });
    });

    describe('Events', function () {
      it('Should emit an event on stake locked', async function () {
        const lockPeriod = 5;

        await expect(await staking.connect(owner).setLockPeriod(lockPeriod))
          .to.emit(staking, 'SetLockPeriod')
          .withArgs(lockPeriod);
      });
    });

    describe('Set minimum stake', function () {
      it('Should assign a value to minimum stake variable', async function () {
        const lockPeriod = 5;

        await staking.connect(owner).setLockPeriod(lockPeriod);
        await expect(await staking.lockPeriod()).to.equal(lockPeriod);
      });
    });
  });

  describe('setRewardPool', function () {
    describe('Validations', function () {
      it('Should revert with the right error if caller is not an owner', async function () {
        await expect(
          staking.connect(operator).setRewardPool(rewardPool.address)
        ).to.be.revertedWith('Caller is not a owner');
      });

      it('Should revert with the right error if not a positive number', async function () {
        await expect(
          staking.connect(owner).setRewardPool(ethers.constants.AddressZero)
        ).to.be.revertedWith('Must be a valid address');
      });
    });

    describe('Events', function () {
      it('Should emit an event on set reward pool', async function () {
        await expect(
          await staking.connect(owner).setRewardPool(rewardPool.address)
        )
          .to.emit(staking, 'SetRewardPool')
          .withArgs(rewardPool.address);
      });
    });

    describe('Set minimum stake', function () {
      it('Should assign a value to minimum stake variable', async function () {
        await staking.connect(owner).setRewardPool(rewardPool.address);
        await expect(await staking.rewardPool()).to.equal(rewardPool.address);
      });
    });
  });

  describe('isRole', function () {
    describe('Is user has role', function () {
      this.beforeEach(async () => {
        await staking
          .connect(owner)
          .setStaker(await operator.getAddress(), Role.Operator);
      });

      it('Should return an user has not Operator role', async function () {
        expect(
          await staking
            .connect(owner)
            .isRole(await operator.getAddress(), Role.ExchangeOracle)
        ).to.equal(false);
      });

      it('Should return an user has Operator role', async function () {
        expect(
          await staking
            .connect(owner)
            .isRole(await operator.getAddress(), Role.Operator)
        ).to.equal(true);
      });
    });
  });

  describe('isAllocation', function () {
    describe('Is escrow address has allocation', function () {
      let escrowAddress: string;

      this.beforeEach(async () => {
        const stakedTokens = 10;

        await staking
          .connect(owner)
          .setStaker(await operator.getAddress(), Role.Operator);
        await staking.connect(operator).stake(stakedTokens);

        const result = await (
          await escrowFactory
            .connect(operator)
            .createEscrow([ethers.constants.AddressZero])
        ).wait();
        const event = result.events?.[0].args;

        expect(event?.eip20).to.equal(
          token.address,
          'token address is correct'
        );
        expect(event?.escrow).to.not.be.null;
        expect(event?.counter.toString()).to.equal('1', 'counter is correct');

        escrowAddress = event?.escrow;
      });

      it('Should return an escrow address has not allocation', async function () {
        expect(
          await staking.connect(owner).isAllocation(escrowAddress)
        ).to.equal(false);
      });

      it('Should return an escrow address has allocation', async function () {
        const allocatedTokens = 5;
        await staking
          .connect(operator)
          .allocate(escrowAddress, allocatedTokens);

        expect(
          await staking.connect(owner).isAllocation(escrowAddress)
        ).to.equal(true);
      });
    });
  });

  describe('hasStake', function () {
    describe('Is stakes has stake', function () {
      this.beforeEach(async () => {
        await staking
          .connect(owner)
          .setStaker(await operator.getAddress(), Role.Operator);
      });

      it('Should return an escrow address has not allocation', async function () {
        expect(
          await staking.connect(owner).hasStake(await operator.getAddress())
        ).to.equal(false);
      });

      it('Should return an escrow address has allocation', async function () {
        const stakedTokens = 10;
        await staking.connect(operator).stake(stakedTokens);

        expect(
          await staking.connect(owner).hasStake(await operator.getAddress())
        ).to.equal(true);
      });
    });
  });

  describe('getAllocation', function () {
    describe('Return allocation by escrow address', function () {
      let escrowAddress: string;
      const allocatedTokens = 5;

      this.beforeEach(async () => {
        const stakedTokens = 10;

        await staking
          .connect(owner)
          .setStaker(await operator.getAddress(), Role.Operator);
        await staking.connect(operator).stake(stakedTokens);

        const result = await (
          await escrowFactory
            .connect(operator)
            .createEscrow([ethers.constants.AddressZero])
        ).wait();
        const event = result.events?.[0].args;

        expect(event?.eip20).to.equal(
          token.address,
          'token address is correct'
        );
        expect(event?.escrow).to.not.be.null;
        expect(event?.counter.toString()).to.equal('1', 'counter is correct');

        escrowAddress = event?.escrow;

        await staking
          .connect(operator)
          .allocate(escrowAddress, allocatedTokens);
      });

      it('Should return a null allocation by escrow address', async function () {
        const allocation = await staking
          .connect(operator)
          .getAllocation(ethers.constants.AddressZero);

        expect(allocation.escrowAddress).to.equal(ethers.constants.AddressZero);
        expect(allocation.staker).to.equal(ethers.constants.AddressZero);
        expect(allocation.tokens).to.equal(0); // Tokens allocated to a escrowAddress
        expect(allocation.createdAt).to.equal(0); // Time when allocation was created
        expect(allocation.closedAt).to.equal(0); // Time when allocation was closed
      });

      it('Should return an allocation by escrow address', async function () {
        const allocation = await staking
          .connect(operator)
          .getAllocation(escrowAddress);

        expect(allocation.escrowAddress).to.equal(escrowAddress);
        expect(allocation.staker).to.equal(await operator.getAddress());
        expect(allocation.tokens).to.equal(allocatedTokens); // Tokens allocated to a escrowAddress
      });
    });
  });

  describe('slash', function () {
    let escrowAddress: string;
    const stakedTokens = 10;
    const allocatedTokens = 5;
    const slashedTokens = 2;

    this.beforeEach(async () => {
      await staking.connect(owner).setRewardPool(rewardPool.address);

      await staking
        .connect(owner)
        .setStaker(await validator.getAddress(), Role.Validator);
      await staking.connect(validator).stake(stakedTokens);

      await staking
        .connect(owner)
        .setStaker(await operator.getAddress(), Role.Operator);
      await staking.connect(operator).stake(stakedTokens);

      const result = await (
        await escrowFactory
          .connect(operator)
          .createEscrow([ethers.constants.AddressZero])
      ).wait();
      const event = result.events?.[0].args;

      expect(event?.eip20).to.equal(token.address, 'token address is correct');
      expect(event?.escrow).to.not.be.null;
      expect(event?.counter.toString()).to.equal('1', 'counter is correct');

      escrowAddress = event?.escrow;

      await staking.connect(operator).allocate(escrowAddress, allocatedTokens);
    });

    describe('Validations', function () {
      it('Should revert with the right error if caller is not a validator', async function () {
        await expect(
          staking
            .connect(operator)
            .slash(await operator.getAddress(), escrowAddress, slashedTokens)
        ).to.be.revertedWith('Caller is not a validator');
      });

      it('Should revert with the right error if invalid address', async function () {
        await expect(
          staking
            .connect(validator)
            .slash(
              await operator.getAddress(),
              ethers.constants.AddressZero,
              slashedTokens
            )
        ).to.be.revertedWith('Must be a valid address');
      });

      // TODO: Add additional tests
    });

    describe('Events', function () {
      it('Should emit an event on stake slashed', async function () {
        await expect(
          await staking
            .connect(validator)
            .slash(await operator.getAddress(), escrowAddress, slashedTokens)
        )
          .to.emit(staking, 'StakeSlashed')
          .withArgs(await validator.getAddress(), anyValue);
      });
    });

    describe('Return allocation by escrow address', function () {
      it('Should slash tokens from stake and transfer to the reward pool', async function () {
        const slashedTokens = 2;

        await staking
          .connect(validator)
          .slash(await operator.getAddress(), escrowAddress, slashedTokens);

        // await staking.connect(operator).withdraw();

        const allocation = await staking
          .connect(operator)
          .getAllocation(escrowAddress);
        await expect(allocation.tokens).to.equal(
          allocatedTokens - slashedTokens
        );

        const stakerAfterSlash = await staking
          .connect(operator)
          .getStaker(await operator.getAddress());
        await expect(stakerAfterSlash.tokensStaked).to.equal(
          stakedTokens - slashedTokens
        );

        await expect(await token.balanceOf(rewardPool.address)).to.equal(
          slashedTokens
        );
      });
    });
  });

  describe('getListOfStakers', function () {
    const stakedTokens = 2;

    this.beforeEach(async () => {
      await Promise.all(
        [
          operator,
          operator2,
          operator3,
          exchangeOracle,
          reputationOracle,
          recordingOracle,
        ].map(async (account, index) => {
          await staking
            .connect(owner)
            .setStaker(await account.getAddress(), Role.Operator);
          await staking.connect(account).stake(stakedTokens * (index + 1));
        })
      );
    });

    it('Should return list of stakers', async () => {
      const [stakers, stakes] = await staking.getListOfStakers(Role.Operator);

      expect(stakers.length).to.equal(6);
      expect(stakes.length).to.equal(6);

      await Promise.all(
        [
          operator,
          operator2,
          operator3,
          exchangeOracle,
          reputationOracle,
          recordingOracle,
        ].map(async (account, index) => {
          expect(stakers[index]).to.equal(await account.getAddress());
          expect(stakes[index].tokensStaked.toString()).to.equal(
            (stakedTokens * (index + 1)).toString()
          );
        })
      );
    });

    it('Should return empty array', async () => {
      const [stakers, stakes] = await staking.getListOfStakers(
        Role.RecordingOracle
      );

      expect(stakers.length).to.equal(0);
      expect(stakes.length).to.equal(0);
    });
  });
});
