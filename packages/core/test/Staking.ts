import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { EventLog, Signer } from 'ethers';
import {
  Escrow,
  EscrowFactory,
  HMToken,
  Staking,
  RewardPool,
} from '../typechain-types';

const MOCK_URL = 'http://google.com/fake';
const MOCK_HASH = 'kGKmnj9BRf';

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
  const minimumStake = 2;
  const lockPeriod = 2;
  const rewardFee = 1;
  const jobRequesterId = 'job-requester-id';

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

  this.beforeAll(async () => {
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
    const HMToken = await ethers.getContractFactory(
      'contracts/HMToken.sol:HMToken'
    );
    token = (await HMToken.deploy(
      1000000000,
      'Human Token',
      18,
      'HMT'
    )) as HMToken;

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
  });

  this.beforeEach(async () => {
    // Deploy Staking Conract
    const Staking = await ethers.getContractFactory('Staking');
    staking = (await upgrades.deployProxy(
      Staking,
      [await token.getAddress(), minimumStake, lockPeriod],
      { kind: 'uups', initializer: 'initialize' }
    )) as unknown as Staking;

    // Deploy Escrow Factory Contract
    const EscrowFactory = await ethers.getContractFactory(
      'contracts/EscrowFactory.sol:EscrowFactory'
    );

    escrowFactory = (await upgrades.deployProxy(
      EscrowFactory,
      [await staking.getAddress()],
      { kind: 'uups', initializer: 'initialize' }
    )) as unknown as EscrowFactory;

    // Deploy Reward Pool Conract
    const RewardPool = await ethers.getContractFactory('RewardPool');
    rewardPool = (await upgrades.deployProxy(
      RewardPool,
      [await token.getAddress(), await staking.getAddress(), rewardFee],
      { kind: 'uups', initializer: 'initialize' }
    )) as unknown as RewardPool;

    // Topup staking address
    await token.connect(owner).transfer(await staking.getAddress(), 1000);

    // Approve spend HMT tokens staking contract
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
        await token.connect(account).approve(await staking.getAddress(), 1000);
      })
    );
  });

  describe('deployment', () => {
    it('Should set the right token address', async () => {
      const result = await staking.token();
      expect(result).to.equal(await token.getAddress());
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

  describe('stake', function () {
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
        await token.connect(operator).approve(await staking.getAddress(), 100);

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
      await staking.connect(operator).stake(amount);
    });

    describe('Validations', function () {
      it('Should revert with the right error if not a positive number', async function () {
        const amount = 0;

        await expect(
          staking.connect(operator).unstake(amount)
        ).to.be.revertedWith('Must be a positive number');
      });

      it('Should revert with the right error if total stake is below the unstake amount', async function () {
        const amount = 15;

        await expect(
          staking.connect(operator).unstake(amount)
        ).to.be.revertedWith('Insufficient amount to unstake');
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

      await staking.connect(operator).stake(amount);

      const result = await (
        await escrowFactory
          .connect(operator)
          .createEscrow(
            await token.getAddress(),
            [await validator.getAddress()],
            jobRequesterId
          )
      ).wait();
      const event = (
        result?.logs?.find(({ topics }) =>
          topics.includes(ethers.id('LaunchedV2(address,address,string)'))
        ) as EventLog
      )?.args;

      expect(event?.token).to.equal(
        await token.getAddress(),
        'token address is correct'
      );
      expect(event?.escrow).to.not.be.null;

      escrowAddress = event?.escrow;
    });

    describe('Validations', function () {
      it('Should revert with the right error if not a valid address', async function () {
        const amount = 5;

        await expect(
          staking.connect(operator).allocate(ethers.ZeroAddress, amount)
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

      await staking.connect(operator).stake(stakeTokens);

      const result = await (
        await escrowFactory
          .connect(operator)
          .createEscrow(
            await token.getAddress(),
            [await validator.getAddress()],
            jobRequesterId
          )
      ).wait();
      const event = (
        result?.logs?.find(({ topics }) =>
          topics.includes(ethers.id('LaunchedV2(address,address,string)'))
        ) as EventLog
      )?.args;

      expect(event?.token).to.equal(
        await token.getAddress(),
        'token address is correct'
      );
      expect(event?.escrow).to.not.be.null;
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
        ).to.be.revertedWith('Ownable: caller is not the owner');
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
        ).to.be.revertedWith('Ownable: caller is not the owner');
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
          staking.connect(operator).setRewardPool(await rewardPool.getAddress())
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('Should revert with the right error if not a positive number', async function () {
        await expect(
          staking.connect(owner).setRewardPool(ethers.ZeroAddress)
        ).to.be.revertedWith('Must be a valid address');
      });
    });

    describe('Events', function () {
      it('Should emit an event on set reward pool', async function () {
        await expect(
          await staking
            .connect(owner)
            .setRewardPool(await rewardPool.getAddress())
        )
          .to.emit(staking, 'SetRewardPool')
          .withArgs(await rewardPool.getAddress());
      });
    });

    describe('Set minimum stake', function () {
      it('Should assign a value to minimum stake variable', async function () {
        await staking
          .connect(owner)
          .setRewardPool(await rewardPool.getAddress());
        await expect(await staking.rewardPool()).to.equal(
          await rewardPool.getAddress()
        );
      });
    });
  });

  describe('isAllocation', function () {
    describe('Is escrow address has allocation', function () {
      let escrowAddress: string;

      this.beforeEach(async () => {
        const stakedTokens = 10;
        await staking.connect(operator).stake(stakedTokens);

        const result = await (
          await escrowFactory
            .connect(operator)
            .createEscrow(
              await token.getAddress(),
              [await validator.getAddress()],
              jobRequesterId
            )
        ).wait();
        const event = (
          result?.logs?.find(({ topics }) =>
            topics.includes(ethers.id('LaunchedV2(address,address,string)'))
          ) as EventLog
        )?.args;

        expect(event?.token).to.equal(
          await token.getAddress(),
          'token address is correct'
        );
        expect(event?.escrow).to.not.be.null;

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

        await staking.connect(operator).stake(stakedTokens);

        const result = await (
          await escrowFactory
            .connect(operator)
            .createEscrow(
              await token.getAddress(),
              [await validator.getAddress()],
              jobRequesterId
            )
        ).wait();
        const event = (
          result?.logs?.find(({ topics }) =>
            topics.includes(ethers.id('LaunchedV2(address,address,string)'))
          ) as EventLog
        )?.args;

        expect(event?.token).to.equal(
          await token.getAddress(),
          'token address is correct'
        );
        expect(event?.escrow).to.not.be.null;

        escrowAddress = event?.escrow;

        await staking
          .connect(operator)
          .allocate(escrowAddress, allocatedTokens);
      });

      it('Should return a null allocation by escrow address', async function () {
        const allocation = await staking
          .connect(operator)
          .getAllocation(ethers.ZeroAddress);

        expect(allocation.escrowAddress).to.equal(ethers.ZeroAddress);
        expect(allocation.staker).to.equal(ethers.ZeroAddress);
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
      await staking.connect(owner).setRewardPool(await rewardPool.getAddress());

      await staking.connect(validator).stake(stakedTokens);

      await staking.connect(operator).stake(stakedTokens);

      const result = await (
        await escrowFactory
          .connect(operator)
          .createEscrow(
            await token.getAddress(),
            [await validator.getAddress()],
            jobRequesterId
          )
      ).wait();
      const event = (
        result?.logs?.find(({ topics }) =>
          topics.includes(ethers.id('LaunchedV2(address,address,string)'))
        ) as EventLog
      )?.args;

      expect(event?.token).to.equal(
        await token.getAddress(),
        'token address is correct'
      );
      expect(event?.escrow).to.not.be.null;

      escrowAddress = event?.escrow;

      await staking.connect(operator).allocate(escrowAddress, allocatedTokens);
    });

    describe('Validations', function () {
      it('Should revert with the right error if caller is not the owner', async function () {
        await expect(
          staking
            .connect(operator)
            .slash(
              await operator.getAddress(),
              await operator.getAddress(),
              escrowAddress,
              slashedTokens
            )
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('Should revert with the right error if invalid address', async function () {
        await expect(
          staking
            .connect(owner)
            .slash(
              await validator.getAddress(),
              await operator.getAddress(),
              ethers.ZeroAddress,
              slashedTokens
            )
        ).to.be.revertedWith('Must be a valid address');
      });

      it('Should revert if slash amount exceeds allocation', async function () {
        await staking
          .connect(owner)
          .slash(
            await validator.getAddress(),
            await operator.getAddress(),
            escrowAddress,
            slashedTokens
          );

        await expect(
          staking
            .connect(owner)
            .slash(
              await validator.getAddress(),
              await operator.getAddress(),
              escrowAddress,
              allocatedTokens
            )
        ).to.be.revertedWith('Slash tokens exceed allocated ones');
      });

      it('Should revert if slash amount is 0', async function () {
        await expect(
          staking
            .connect(owner)
            .slash(
              await validator.getAddress(),
              await operator.getAddress(),
              escrowAddress,
              0
            )
        ).to.be.revertedWith('Must be a positive number');
      });
    });

    describe('Events', function () {
      it('Should emit an event on stake slashed', async function () {
        await expect(
          await staking
            .connect(owner)
            .slash(
              await validator.getAddress(),
              await operator.getAddress(),
              escrowAddress,
              slashedTokens
            )
        )
          .to.emit(staking, 'StakeSlashed')
          .withArgs(
            await operator.getAddress(),
            slashedTokens,
            escrowAddress,
            await validator.getAddress()
          );
      });
    });

    describe('Return allocation by escrow address', function () {
      it('Should slash tokens from stake and transfer to the reward pool', async function () {
        const slashedTokens = 2;

        await staking
          .connect(owner)
          .slash(
            await validator.getAddress(),
            await operator.getAddress(),
            escrowAddress,
            slashedTokens
          );

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

        await expect(
          await token.balanceOf(await rewardPool.getAddress())
        ).to.equal(slashedTokens);
      });
    });
  });

  describe('getListOfStakers', function () {
    const stakedTokens = 2;
    let accounts: Signer[];

    this.beforeEach(async () => {
      accounts = [
        operator,
        operator2,
        operator3,
        exchangeOracle,
        reputationOracle,
        recordingOracle,
      ];

      for (let index = 0; index < accounts.length; index++) {
        await staking
          .connect(accounts[index])
          .stake(stakedTokens * (index + 1));
      }
    });

    it('Should return list of stakers', async () => {
      const [stakers, stakes] = await staking.getListOfStakers();

      expect(stakers.length).to.equal(6);
      expect(stakes.length).to.equal(6);

      for (let index = 0; index < stakers.length; index++) {
        expect(stakers[index]).to.equal(await accounts[index].getAddress());
        expect(stakes[index].tokensStaked.toString()).to.equal(
          (stakedTokens * (index + 1)).toString()
        );
      }
    });
  });

  describe('closeAllocation', function () {
    let escrowAddress: string;
    let escrow: Escrow;

    this.beforeEach(async () => {
      const amount = 10;
      const allocationAmount = 5;

      await staking.connect(operator).stake(amount);

      const result = await (
        await escrowFactory
          .connect(operator)
          .createEscrow(
            await token.getAddress(),
            [
              await validator.getAddress(),
              await reputationOracle.getAddress(),
              await recordingOracle.getAddress(),
            ],
            jobRequesterId
          )
      ).wait();
      const event = (
        result?.logs?.find(({ topics }) =>
          topics.includes(ethers.id('LaunchedV2(address,address,string)'))
        ) as EventLog
      )?.args;

      expect(event?.token).to.equal(
        await token.getAddress(),
        'token address is correct'
      );
      expect(event?.escrow).to.not.be.null;

      escrowAddress = event?.escrow;

      // Fund escrow
      await token.connect(owner).transfer(escrowAddress, 100);

      const EscrowFactory = await ethers.getContractFactory(
        'contracts/Escrow.sol:Escrow'
      );
      escrow = (await EscrowFactory.attach(escrowAddress)) as Escrow;

      // Setup escrow
      await escrow
        .connect(operator)
        .setup(
          await reputationOracle.getAddress(),
          await recordingOracle.getAddress(),
          await exchangeOracle.getAddress(),
          10,
          10,
          10,
          MOCK_URL,
          MOCK_HASH
        );

      await staking
        .connect(operator)
        .allocate(escrowAddress.toString(), allocationAmount);
    });

    describe('Validations', function () {
      it('Should revert with the right error if not a valid address', async function () {
        await expect(
          staking.connect(operator).closeAllocation(ethers.ZeroAddress)
        ).to.be.revertedWith('Must be a valid address');
      });

      it('Should revert with the right error if the caller is not the allocator', async function () {
        await expect(
          staking.connect(validator).closeAllocation(escrowAddress.toString())
        ).to.be.revertedWith('Only the allocator can close the allocation');
      });

      it('Should revert with the right error if escrow is not completed nor cancelled', async function () {
        await expect(
          staking.connect(operator).closeAllocation(escrowAddress.toString())
        ).to.be.revertedWith('Allocation has no completed state');
      });
    });

    describe('Close allocation on completed/cancelled escrows', function () {
      it('Should close allocation on completed escrows', async function () {
        // Bulk payout & Complete Escrow
        await escrow
          .connect(operator)
          .bulkPayOut(
            [await operator2.getAddress()],
            [100],
            MOCK_URL,
            MOCK_HASH,
            '000'
          );

        await escrow.connect(operator).complete();

        // Close allocation
        await staking
          .connect(operator)
          .closeAllocation(escrowAddress.toString());

        const allocation = await staking
          .connect(operator)
          .getAllocation(escrowAddress.toString());

        expect(allocation.closedAt).not.to.be.null;
        expect(allocation.tokens.toString()).to.equal('0');
      });

      it('Should close allocation on cancelled escrows', async function () {
        // Close escrow
        await escrow.connect(operator).cancel();

        // Close allocation
        await staking
          .connect(operator)
          .closeAllocation(escrowAddress.toString());

        const allocation = await staking
          .connect(operator)
          .getAllocation(escrowAddress.toString());

        expect(allocation.closedAt).not.to.be.null;
        expect(allocation.tokens.toString()).to.equal('0');
      });
    });
  });
});
