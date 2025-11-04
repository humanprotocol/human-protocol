import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { expect } from 'chai';
import { EventLog, Signer, ZeroAddress } from 'ethers';
import { ethers, upgrades } from 'hardhat';
import { EscrowFactory, HMToken, Staking } from '../typechain-types';
import { faker } from '@faker-js/faker';

let owner: Signer,
  launcher1: Signer,
  admin: Signer,
  launcher2: Signer,
  exchangeOracle: Signer,
  recordingOracle: Signer,
  reputationOracle: Signer;
let exchangeOracleAddress: string,
  recordingOracleAddress: string,
  reputationOracleAddress: string;

let token: HMToken, escrowFactory: EscrowFactory, staking: Staking;
let stakingAddress: string, tokenAddress: string;

const MINIMUM_STAKE = ethers.parseEther('10');
const LOCK_PERIOD = 2;
const FEE_PERCENTAGE = 5;

const FIXTURE_REQUESTER_ID = faker.string.alphanumeric(10);
const FIXTURE_STAKE_AMOUNT = ethers.parseEther('10');

async function stake(staker: Signer, amount: bigint = FIXTURE_STAKE_AMOUNT) {
  await token.connect(staker).approve(stakingAddress, amount);
  await staking.connect(staker).stake(amount);
}

describe('EscrowFactory', function () {
  before(async () => {
    [
      owner,
      launcher1,
      admin,
      launcher2,
      exchangeOracle,
      recordingOracle,
      reputationOracle,
    ] = await ethers.getSigners();
    exchangeOracleAddress = await exchangeOracle.getAddress();
    recordingOracleAddress = await recordingOracle.getAddress();
    reputationOracleAddress = await reputationOracle.getAddress();

    const HMToken = await ethers.getContractFactory(
      'contracts/HMToken.sol:HMToken'
    );
    token = (await HMToken.deploy(
      1000000000,
      'Human Token',
      18,
      'HMT'
    )) as HMToken;
    tokenAddress = await token.getAddress();

    await token
      .connect(owner)
      .transfer(await launcher1.getAddress(), ethers.parseEther('100000'));
    await token
      .connect(owner)
      .transfer(await launcher2.getAddress(), ethers.parseEther('100000'));

    const Staking = await ethers.getContractFactory('Staking');
    staking = await Staking.deploy(
      await token.getAddress(),
      MINIMUM_STAKE,
      LOCK_PERIOD,
      FEE_PERCENTAGE
    );
    stakingAddress = await staking.getAddress();

    const EscrowFactory = await ethers.getContractFactory(
      'contracts/EscrowFactory.sol:EscrowFactory'
    );

    escrowFactory = (await upgrades.deployProxy(
      EscrowFactory,
      [await staking.getAddress(), MINIMUM_STAKE],
      { kind: 'uups', initializer: 'initialize' }
    )) as unknown as EscrowFactory;
  });

  describe('deployment', () => {
    describe('reverts', () => {
      it('reverts when staking address is zero address', async () => {
        const EscrowFactory = await ethers.getContractFactory(
          'contracts/EscrowFactory.sol:EscrowFactory'
        );

        await expect(
          upgrades.deployProxy(EscrowFactory, [ZeroAddress, MINIMUM_STAKE], {
            kind: 'uups',
            initializer: 'initialize',
          }) as unknown as EscrowFactory
        ).revertedWith('Zero Address');
      });
    });

    describe('succeeds', () => {
      it('factory deployed successfully', async () => {
        const EscrowFactory = await ethers.getContractFactory(
          'contracts/EscrowFactory.sol:EscrowFactory'
        );

        const escrowFactory = (await upgrades.deployProxy(
          EscrowFactory,
          [stakingAddress, MINIMUM_STAKE],
          {
            kind: 'uups',
            initializer: 'initialize',
          }
        )) as unknown as EscrowFactory;

        expect(await escrowFactory.minimumStake()).to.equal(MINIMUM_STAKE);
      });
    });
  });

  describe('setStakingAddress()', () => {
    describe('reverts', () => {
      it('reverts when staking address is zero address', async () => {
        await expect(
          escrowFactory.connect(owner).setStakingAddress(ZeroAddress)
        ).to.be.revertedWith('Zero Address');
      });

      it('reverts when caller is not the owner', async () => {
        await expect(
          escrowFactory.connect(launcher1).setStakingAddress(stakingAddress)
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });
    });

    describe('succeeds', () => {
      it('staking address set successfully', async () => {
        const Staking = await ethers.getContractFactory('Staking');
        const newStaking = await Staking.deploy(
          await token.getAddress(),
          MINIMUM_STAKE,
          LOCK_PERIOD,
          FEE_PERCENTAGE
        );
        const newStakingAddress = await newStaking.getAddress();
        await expect(
          escrowFactory.connect(owner).setStakingAddress(newStakingAddress)
        )
          .to.emit(escrowFactory, 'SetStakingAddress')
          .withArgs(newStakingAddress);

        expect(await escrowFactory.staking()).to.equal(newStakingAddress);
        stakingAddress = newStakingAddress;
        staking = newStaking;
      });
    });
  });

  describe('setMinimumStake()', () => {
    describe('reverts', () => {
      it('reverts when minimum stake is zero', async () => {
        await expect(
          escrowFactory.connect(owner).setMinimumStake(0)
        ).to.be.revertedWith('Must be a positive number');
      });

      it('reverts when caller is not the owner', async () => {
        await expect(
          escrowFactory.connect(launcher1).setMinimumStake(0)
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });
    });

    describe('succeeds', () => {
      it('minimum stake set successfully', async () => {
        const newMinimumStake = ethers.parseEther('5');
        await expect(
          escrowFactory.connect(owner).setMinimumStake(newMinimumStake)
        )
          .to.emit(escrowFactory, 'SetMinumumStake')
          .withArgs(newMinimumStake);

        expect(await escrowFactory.minimumStake()).to.equal(newMinimumStake);
      });
    });
  });

  describe('setAdmin()', () => {
    describe('reverts', () => {
      it('reverts when admin address is zero address', async () => {
        await expect(
          escrowFactory.connect(owner).setAdmin(ZeroAddress)
        ).to.be.revertedWith('Zero Address');
      });

      it('reverts when caller is not the owner', async () => {
        await expect(
          escrowFactory.connect(launcher1).setAdmin(await admin.getAddress())
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });
    });

    describe('succeeds', () => {
      it('new admin set successfully', async () => {
        const adminAddress = await admin.getAddress();

        await escrowFactory.connect(owner).setAdmin(adminAddress);

        expect(await escrowFactory.admin()).to.equal(adminAddress);
      });
    });
  });

  describe('createEscrow()', () => {
    describe('reverts', () => {
      it('reverts when launcher has insufficient stake', async () => {
        await expect(
          escrowFactory
            .connect(launcher1)
            .createEscrow(tokenAddress, FIXTURE_REQUESTER_ID)
        ).to.be.revertedWith('Insufficient stake');
      });
    });

    describe('succeeds', () => {
      it('creates an escrow successfully', async () => {
        await stake(launcher1);

        const tx = await escrowFactory
          .connect(launcher1)
          .createEscrow(tokenAddress, FIXTURE_REQUESTER_ID);

        await expect(tx)
          .to.emit(escrowFactory, 'LaunchedV2')
          .withArgs(tokenAddress, anyValue, FIXTURE_REQUESTER_ID);

        const receipt = await tx.wait();
        const event = (
          receipt?.logs?.find(({ topics }) =>
            topics.includes(ethers.id('LaunchedV2(address,address,string)'))
          ) as EventLog
        )?.args;

        expect(event).to.not.be.undefined;
        const escrowAddress = event[1];
        expect(await escrowFactory.hasEscrow(escrowAddress)).to.be.true;
        expect(await escrowFactory.lastEscrow()).to.equal(escrowAddress);
      });
    });
  });

  describe('createFundAndSetupEscrow()', () => {
    const fee = faker.number.int({ min: 1, max: 5 });
    const manifestUrl = faker.internet.url();
    const manifestHash = faker.string.alphanumeric(46);
    const fundAmount = ethers.parseEther(
      faker.finance.amount({ min: 1, max: 100 })
    );
    describe('reverts', () => {
      it('reverts when fund amount is 0', async () => {
        await expect(
          escrowFactory
            .connect(launcher2)
            .createFundAndSetupEscrow(
              tokenAddress,
              0,
              FIXTURE_REQUESTER_ID,
              reputationOracleAddress,
              recordingOracleAddress,
              exchangeOracleAddress,
              fee,
              fee,
              fee,
              manifestUrl,
              manifestHash
            )
        ).to.be.revertedWith('Amount is 0');
      });

      it('reverts when launcher has insufficient stake', async () => {
        await expect(
          escrowFactory
            .connect(launcher2)
            .createFundAndSetupEscrow(
              tokenAddress,
              fundAmount,
              FIXTURE_REQUESTER_ID,
              reputationOracleAddress,
              recordingOracleAddress,
              exchangeOracleAddress,
              fee,
              fee,
              fee,
              manifestUrl,
              manifestHash
            )
        ).to.be.revertedWith('Insufficient stake');
      });

      it('reverts when allowance is too low', async () => {
        await stake(launcher2);
        await token
          .connect(launcher2)
          .approve(await escrowFactory.getAddress(), fundAmount / 2n);

        await expect(
          escrowFactory
            .connect(launcher2)
            .createFundAndSetupEscrow(
              tokenAddress,
              fundAmount,
              FIXTURE_REQUESTER_ID,
              reputationOracleAddress,
              recordingOracleAddress,
              exchangeOracleAddress,
              fee,
              fee,
              fee,
              manifestUrl,
              manifestHash
            )
        ).to.be.revertedWith('Spender allowance too low');
      });
    });

    describe('succeeds', () => {
      it('creates an escrow successfully', async () => {
        await stake(launcher2);

        await token
          .connect(launcher2)
          .approve(await escrowFactory.getAddress(), fundAmount);

        const tx = await escrowFactory
          .connect(launcher2)
          .createFundAndSetupEscrow(
            tokenAddress,
            fundAmount,
            FIXTURE_REQUESTER_ID,
            reputationOracleAddress,
            recordingOracleAddress,
            exchangeOracleAddress,
            fee,
            fee,
            fee,
            manifestUrl,
            manifestHash
          );

        const receipt = await tx.wait();
        const event = (
          receipt?.logs?.find(({ topics }) =>
            topics.includes(ethers.id('LaunchedV2(address,address,string)'))
          ) as EventLog
        )?.args;

        expect(event).to.not.be.undefined;
        const escrowAddress = event[1];

        const escrow = await ethers.getContractAt(
          'contracts/Escrow.sol:Escrow',
          escrowAddress
        );

        await expect(tx)
          .to.emit(escrowFactory, 'LaunchedV2')
          .withArgs(tokenAddress, escrowAddress, FIXTURE_REQUESTER_ID)
          .to.emit(escrow, 'PendingV2')
          .withArgs(
            manifestUrl,
            manifestHash,
            reputationOracleAddress,
            recordingOracleAddress,
            exchangeOracleAddress
          )
          .to.emit(escrow, 'Fund')
          .withArgs(fundAmount);

        expect(await escrowFactory.hasEscrow(escrowAddress)).to.be.true;
        expect(await escrowFactory.lastEscrow()).to.equal(escrowAddress);
      });
    });
  });
});
