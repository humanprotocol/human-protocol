import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { EventLog, Signer } from 'ethers';
import { EscrowFactory, HMToken, Staking } from '../typechain-types';

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
  const feePercentage = 10;
  const jobRequesterId = 'job-requester-id';

  let owner: Signer,
    validator: Signer,
    operator: Signer,
    operator2: Signer,
    operator3: Signer,
    exchangeOracle: Signer,
    reputationOracle: Signer,
    recordingOracle: Signer;

  let token: HMToken, escrowFactory: EscrowFactory, staking: Staking;

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
    // Deploy Staking Contract
    const Staking = await ethers.getContractFactory('Staking');
    staking = (await upgrades.deployProxy(
      Staking,
      [await token.getAddress(), minimumStake, lockPeriod, feePercentage],
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

    it('Should set the right fee percentage', async () => {
      const result = await staking.feePercentage();
      expect(result.toString()).to.equal(feePercentage.toString());
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
          await staking
            .connect(operator)
            .getStakedTokens(await operator.getAddress())
        ).to.above(0);
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
          .stakes(await operator.getAddress());
        await expect(staker.tokensLocked).to.equal(amount.toString());
        await expect(staker.tokensLockedUntil).to.not.equal('0');
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

    describe('Withdrawal without tokens available', function () {
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
            .stakes(await operator.getAddress());

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
            .stakes(await operator.getAddress());

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

    describe('Set lock period', function () {
      it('Should assign a value to lock period variable', async function () {
        const lockPeriod = 5;

        await staking.connect(owner).setLockPeriod(lockPeriod);
        await expect(await staking.lockPeriod()).to.equal(lockPeriod);
      });
    });
  });

  describe('setFeePercentage', function () {
    describe('Validations', function () {
      it('Should revert with the right error if caller is not an owner', async function () {
        const feePercentage = 0;

        await expect(
          staking.connect(operator).setFeePercentage(feePercentage)
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('Should revert with the right error if exceed the maximum value', async function () {
        const feePercentage = 120;

        await expect(
          staking.connect(owner).setFeePercentage(feePercentage)
        ).to.be.revertedWith('Fee cannot exceed 100%');
      });
    });

    describe('Set fee percentage', function () {
      it('Should assign a value to fee percentage variable', async function () {
        const feePercentage = 5;

        await staking.connect(owner).setFeePercentage(feePercentage);
        await expect(await staking.feePercentage()).to.equal(feePercentage);
      });
    });
  });

  describe('slash', function () {
    let escrowAddress: string;
    const stakedTokens = 100;
    const slashedTokens = 100;

    this.beforeEach(async () => {
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
    });

    describe('Validations', function () {
      it('Should revert with the right error if caller is not an allowed slasher', async function () {
        await expect(
          staking
            .connect(operator)
            .slash(
              await operator.getAddress(),
              await operator.getAddress(),
              escrowAddress,
              slashedTokens
            )
        ).to.be.revertedWith(`Caller is not a slasher`);
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
        ).to.be.revertedWith('Must be a valid escrow address');
      });

      it('Should revert if slash amount exceeds staking', async function () {
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
              stakedTokens
            )
        ).to.be.revertedWith('Slash amount exceeds staked amount');
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
        const feeAmount = (slashedTokens * feePercentage) / 100;
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
            slashedTokens - feeAmount,
            escrowAddress,
            await validator.getAddress()
          );
      });
    });

    it('Should transfer the slashed amount to the slasher', async function () {
      const initialBalance = await token.connect(owner).balanceOf(validator);
      const initialStake = (await staking.connect(owner).stakes(operator))
        .tokensStaked;
      await staking
        .connect(owner)
        .slash(
          await validator.getAddress(),
          await operator.getAddress(),
          escrowAddress,
          slashedTokens
        );
      const feeAmount = (slashedTokens * feePercentage) / 100;
      const finalBalance = await token.connect(owner).balanceOf(validator);
      const finalStake = (await staking.connect(owner).stakes(operator))
        .tokensStaked;
      expect(finalBalance - initialBalance).to.equal(slashedTokens - feeAmount);
      expect(initialStake - finalStake).to.equal(slashedTokens - feeAmount);
      expect(await staking.connect(owner).feeBalance()).to.equal(feeAmount);
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
      const [stakers, stakes] = await staking.getListOfStakers(0, 10);

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

  describe('withdrawFees', function () {
    let escrowAddress: string;
    const stakedTokens = 100;
    const slashedTokens = 100;

    this.beforeEach(async () => {
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
    });

    describe('Valitions', function () {
      it('Should revert with the right error if caller is not an owner', async function () {
        await expect(
          staking.connect(operator).withdrawFees()
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('Should revert with the right error if there are no fees to withdraw', async function () {
        await expect(staking.connect(owner).withdrawFees()).to.be.revertedWith(
          'No fees to withdraw'
        );
      });
    });

    describe('Withdraw fees', function () {
      let feeAmount: number;
      this.beforeEach(async () => {
        await staking
          .connect(owner)
          .slash(
            await validator.getAddress(),
            await operator.getAddress(),
            escrowAddress,
            slashedTokens
          );

        feeAmount = (slashedTokens * feePercentage) / 100;
        expect(await staking.connect(owner).feeBalance()).to.equal(feeAmount);
      });

      it('Should withdraw the correct amount of fees', async function () {
        const initialBalance = await token.connect(owner).balanceOf(owner);
        const initialFees = await staking.connect(owner).feeBalance();
        expect(initialFees).to.equal(feeAmount.toString());

        await staking.connect(owner).withdrawFees();

        const finalBalance = await token.connect(owner).balanceOf(owner);
        const finalFees = await staking.connect(owner).feeBalance();
        expect(finalFees).to.equal('0');
        expect(finalBalance - initialBalance).to.equal(feeAmount);
      });
    });
  });

  describe('addSlasher', function () {
    let newSlasher: string;

    this.beforeEach(async () => {
      newSlasher = await operator2.getAddress();
    });

    describe('Validaciones', function () {
      it('Should revert with the right error if caller is not the owner', async function () {
        await expect(
          staking.connect(operator).addSlasher(newSlasher)
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('Should revert with the right error if the address is already a slasher', async function () {
        await staking.connect(owner).addSlasher(newSlasher);
        await expect(
          staking.connect(owner).addSlasher(newSlasher)
        ).to.be.revertedWith('Address is already a slasher');
      });
    });

    describe('Add slasher', function () {
      it('Should add a new slasher', async function () {
        await staking.connect(owner).addSlasher(newSlasher);
        expect(await staking.slashers(newSlasher)).to.equal(true);
      });
    });
  });

  describe('removeSlasher', function () {
    let newSlasher: string;

    this.beforeEach(async () => {
      newSlasher = await operator2.getAddress();
      await staking.connect(owner).addSlasher(newSlasher);
    });

    describe('Validaciones', function () {
      it('Should revert with the right error if caller is not the owner', async function () {
        await expect(
          staking.connect(operator).removeSlasher(newSlasher)
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('Should revert with the right error if the address is not a slasher', async function () {
        const nonSlasher = await operator3.getAddress();
        await expect(
          staking.connect(owner).removeSlasher(nonSlasher)
        ).to.be.revertedWith('Address is not a slasher');
      });
    });

    describe('Remove slasher', function () {
      it('Should remove the slasher', async function () {
        await staking.connect(owner).removeSlasher(newSlasher);
        expect(await staking.slashers(newSlasher)).to.equal(false);
      });
    });
  });
});
