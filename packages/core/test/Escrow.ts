/* eslint-disable @typescript-eslint/no-explicit-any */
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { EventLog, Signer, ZeroAddress } from 'ethers';
import { Escrow, HMToken } from '../typechain-types';
import { faker } from '@faker-js/faker';
import { ad } from '@faker-js/faker/dist/airline-BUL6NtOJ';

const BULK_MAX_COUNT = 100;
const STANDARD_DURATION = 100;

const MOCK_URL = faker.internet.url();
const MOCK_HASH = faker.string.alphanumeric(10);

enum Status {
  Launched = 0,
  Pending = 1,
  Partial = 2,
  Paid = 3,
  Complete = 4,
  Cancelled = 5,
}

let owner: Signer;
let launcher: Signer;
let reputationOracle: Signer;
let recordingOracle: Signer;
let exchangeOracle: Signer;
let external: Signer;
let admin: Signer;
let restAccounts: Signer[];

let ownerAddress: string;
let launcherAddress: string;
let reputationOracleAddress: string;
let recordingOracleAddress: string;
let exchangeOracleAddress: string;
let externalAddress: string;
let adminAddress: string;

let token: HMToken;
let escrow: Escrow;
let tokenAddress: string;

async function deployEscrow(
  tokenAddr: string = tokenAddress,
  launcherAddr: string = launcherAddress,
  adminAddr: string = adminAddress,
  duration: number = STANDARD_DURATION
) {
  const Escrow = await ethers.getContractFactory('contracts/Escrow.sol:Escrow');
  escrow = (await Escrow.deploy(
    tokenAddr,
    launcherAddr,
    adminAddr,
    duration
  )) as Escrow;
}

async function fundEscrow(amount?: bigint): Promise<bigint> {
  const value = amount ?? ethers.parseEther('100');
  await token.connect(owner).transfer(await escrow.getAddress(), value);
  return value;
}

async function setupEscrow(
  repFee = 3,
  recFee = 3,
  excFee = 3,
  url: string = MOCK_URL,
  hash: string = MOCK_HASH
) {
  await escrow
    .connect(launcher)
    .setup(
      reputationOracleAddress,
      recordingOracleAddress,
      exchangeOracleAddress,
      repFee,
      recFee,
      excFee,
      url,
      hash
    );
}

async function storeResults(url: string = MOCK_URL, hash: string = MOCK_HASH) {
  await escrow.connect(recordingOracle).storeResults(url, hash);
}

describe('Escrow', function () {
  before(async () => {
    [
      owner,
      launcher,
      reputationOracle,
      recordingOracle,
      exchangeOracle,
      external,
      admin,
      ...restAccounts
    ] = await ethers.getSigners();

    ownerAddress = await owner.getAddress();
    launcherAddress = await launcher.getAddress();
    reputationOracleAddress = await reputationOracle.getAddress();
    recordingOracleAddress = await recordingOracle.getAddress();
    exchangeOracleAddress = await exchangeOracle.getAddress();
    externalAddress = await external.getAddress();
    adminAddress = await admin.getAddress();

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
  });

  describe('deployment', () => {
    describe('reverts', () => {
      it('reverts when token is zero address', async () => {
        await expect(deployEscrow(ZeroAddress)).revertedWith('Zero address');
      });

      it('reverts when launcher is zero address', async () => {
        await expect(deployEscrow(tokenAddress, ZeroAddress)).revertedWith(
          'Zero address'
        );
      });

      it('reverts when admin is zero address', async () => {
        await expect(
          deployEscrow(tokenAddress, launcherAddress, ZeroAddress)
        ).revertedWith('Zero address');
      });

      it('reverts when duration is 0', async () => {
        await expect(
          deployEscrow(tokenAddress, launcherAddress, adminAddress, 0)
        ).revertedWith('Duration is 0');
      });
    });

    describe('succeeds', () => {
      it('escrow deployed successfully', async () => {
        await deployEscrow();
        const block = await ethers.provider.getBlock(
          escrow.deploymentTransaction()?.blockNumber as number
        );

        expect(await escrow.token()).to.equal(tokenAddress);
        expect(await escrow.launcher()).to.equal(launcherAddress);
        expect(await escrow.admin()).to.equal(adminAddress);
        expect(await escrow.status()).to.equal(Status.Launched);
        expect(await escrow.duration()).to.equal(
          (block?.timestamp as number) + STANDARD_DURATION
        );
        expect(await escrow.escrowFactory()).to.equal(ownerAddress);
      });
    });
  });

  describe('setup()', () => {
    beforeEach(async () => {
      await deployEscrow();
    });
    describe('reverts', () => {
      it('reverts when called by unauthorised address', async () => {
        await expect(
          escrow
            .connect(external)
            .setup(
              reputationOracleAddress,
              recordingOracleAddress,
              exchangeOracleAddress,
              3,
              3,
              3,
              MOCK_URL,
              MOCK_HASH
            )
        ).to.be.revertedWith('Unauthorised');
        await expect(
          escrow
            .connect(exchangeOracle)
            .setup(
              reputationOracleAddress,
              recordingOracleAddress,
              exchangeOracleAddress,
              3,
              3,
              3,
              MOCK_URL,
              MOCK_HASH
            )
        ).to.be.revertedWith('Unauthorised');
        await expect(
          escrow
            .connect(recordingOracle)
            .setup(
              reputationOracleAddress,
              recordingOracleAddress,
              exchangeOracleAddress,
              3,
              3,
              3,
              MOCK_URL,
              MOCK_HASH
            )
        ).to.be.revertedWith('Unauthorised');
        await expect(
          escrow
            .connect(reputationOracle)
            .setup(
              reputationOracleAddress,
              recordingOracleAddress,
              exchangeOracleAddress,
              3,
              3,
              3,
              MOCK_URL,
              MOCK_HASH
            )
        ).to.be.revertedWith('Unauthorised');
      });

      it('reverts when reputation oracle is zero address', async () => {
        await expect(
          escrow
            .connect(launcher)
            .setup(
              ethers.ZeroAddress,
              recordingOracleAddress,
              exchangeOracleAddress,
              3,
              3,
              3,
              MOCK_URL,
              MOCK_HASH
            )
        ).to.be.revertedWith('Invalid reputation oracle');
      });

      it('reverts when zero recording oracle is zero address', async () => {
        await expect(
          escrow
            .connect(launcher)
            .setup(
              reputationOracleAddress,
              ethers.ZeroAddress,
              exchangeOracleAddress,
              3,
              3,
              3,
              MOCK_URL,
              MOCK_HASH
            )
        ).to.be.revertedWith('Invalid recording oracle');
      });

      it('reverts when zero exchange oracle is zero address', async () => {
        await expect(
          escrow
            .connect(launcher)
            .setup(
              reputationOracleAddress,
              recordingOracleAddress,
              ethers.ZeroAddress,
              3,
              3,
              3,
              MOCK_URL,
              MOCK_HASH
            )
        ).to.be.revertedWith('Invalid exchange oracle');
      });

      it('reverts when total fee > 100', async () => {
        await expect(
          escrow
            .connect(launcher)
            .setup(
              reputationOracleAddress,
              recordingOracleAddress,
              exchangeOracleAddress,
              60,
              30,
              20,
              MOCK_URL,
              MOCK_HASH
            )
        ).to.be.revertedWith('Percentage out of bounds');
      });
    });
    describe('succeeds', () => {
      it('Launcher: sets up successfully', async () => {
        const amount = await fundEscrow();
        await expect(
          escrow
            .connect(launcher)
            .setup(
              reputationOracleAddress,
              recordingOracleAddress,
              exchangeOracleAddress,
              5,
              5,
              5,
              MOCK_URL,
              MOCK_HASH
            )
        )
          .to.emit(escrow, 'PendingV2')
          .withArgs(
            MOCK_URL,
            MOCK_HASH,
            reputationOracleAddress,
            recordingOracleAddress,
            exchangeOracleAddress
          )
          .to.emit(escrow, 'Fund')
          .withArgs(amount);

        expect(await escrow.status()).to.equal(Status.Pending);
        expect(await escrow.manifestUrl()).to.equal(MOCK_URL);
        expect(await escrow.manifestHash()).to.equal(MOCK_HASH);
      });

      it('Admin: sets up successfully', async () => {
        const amount = await fundEscrow();
        await expect(
          escrow
            .connect(admin)
            .setup(
              reputationOracleAddress,
              recordingOracleAddress,
              exchangeOracleAddress,
              5,
              5,
              5,
              MOCK_URL,
              MOCK_HASH
            )
        )
          .to.emit(escrow, 'PendingV2')
          .withArgs(
            MOCK_URL,
            MOCK_HASH,
            reputationOracleAddress,
            recordingOracleAddress,
            exchangeOracleAddress
          )
          .to.emit(escrow, 'Fund')
          .withArgs(amount);

        expect(await escrow.status()).to.equal(Status.Pending);
        expect(await escrow.manifestUrl()).to.equal(MOCK_URL);
        expect(await escrow.manifestHash()).to.equal(MOCK_HASH);
      });
    });
  });

  describe('storeResults()', () => {
    beforeEach(async () => {
      await deployEscrow();
      await fundEscrow();
      await setupEscrow();
    });
    describe('reverts', () => {
      it('reverts outside Pending/Partial', async () => {
        await escrow.connect(launcher).cancel();
        expect(await escrow.status()).to.equal(Status.Cancelled);
        await expect(storeResults(MOCK_URL, MOCK_HASH)).to.be.revertedWith(
          'Invalid status'
        );
      });

      it('reverts with Empty URL', async () => {
        await expect(storeResults('', MOCK_HASH)).to.be.revertedWith(
          'Empty URL'
        );
      });

      it('reverts with Empty hash', async () => {
        await expect(storeResults(MOCK_URL, '')).to.be.revertedWith(
          'Empty hash'
        );
      });

      it('reverts when called by unauthorised address', async () => {
        await expect(
          escrow.connect(external).storeResults(MOCK_URL, MOCK_HASH)
        ).to.be.revertedWith('Unauthorised');
        await expect(
          escrow.connect(launcher).storeResults(MOCK_URL, MOCK_HASH)
        ).to.be.revertedWith('Unauthorised');
        await expect(
          escrow.connect(reputationOracle).storeResults(MOCK_URL, MOCK_HASH)
        ).to.be.revertedWith('Unauthorised');
        await expect(
          escrow.connect(exchangeOracle).storeResults(MOCK_URL, MOCK_HASH)
        ).to.be.revertedWith('Unauthorised');
      });
    });
    describe('succeeds', () => {
      it('Recording oracle: stores results successfully', async () => {
        await expect(
          escrow.connect(recordingOracle).storeResults(MOCK_URL, MOCK_HASH)
        )
          .to.emit(escrow, 'IntermediateStorage')
          .withArgs(MOCK_URL, MOCK_HASH);
      });

      it('Admin: stores results successfully', async () => {
        await expect(escrow.connect(admin).storeResults(MOCK_URL, MOCK_HASH))
          .to.emit(escrow, 'IntermediateStorage')
          .withArgs(MOCK_URL, MOCK_HASH);
      });
    });
  });

  describe('cancel()', () => {
    beforeEach(async () => {
      await deployEscrow();
      await fundEscrow();
      await setupEscrow();
    });

    describe('reverts', function () {
      it('reverts when called by unauthorised address', async function () {
        await expect(escrow.connect(external).cancel()).to.be.revertedWith(
          'Unauthorised'
        );
        await expect(
          escrow.connect(recordingOracle).cancel()
        ).to.be.revertedWith('Unauthorised');
        await expect(
          escrow.connect(exchangeOracle).cancel()
        ).to.be.revertedWith('Unauthorised');
        await expect(
          escrow.connect(reputationOracle).cancel()
        ).to.be.revertedWith('Unauthorised');
      });

      it('reverts when escrow has no funds (complete or cancelled)', async function () {
        const balance = await token.balanceOf(escrow.getAddress());
        await escrow
          .connect(admin)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256)'
          ]([externalAddress], [balance], MOCK_URL, MOCK_HASH, '000');
        escrow.connect(admin).complete();
        await expect(escrow.connect(launcher).cancel()).to.be.revertedWith(
          'No funds'
        );
      });
    });

    describe('Succeeds', async function () {
      it('Launcher: cancels escrow succesfully', async () => {
        const launcherBalance = await token.balanceOf(launcherAddress);
        await expect(escrow.connect(launcher).cancel()).to.emit(
          escrow,
          'Cancelled'
        );
        expect(await escrow.status()).to.equal(Status.Cancelled);

        expect(await token.balanceOf(escrow.getAddress())).to.equal('0');
        expect(await token.balanceOf(launcherAddress)).to.equal(
          launcherBalance + ethers.parseEther('100')
        );
      });

      it('Admin: cancels escrow succesfully', async () => {
        const launcherBalance = await token.balanceOf(launcherAddress);
        await expect(escrow.connect(admin).cancel()).to.emit(
          escrow,
          'Cancelled'
        );
        expect(await escrow.status()).to.equal(Status.Cancelled);

        expect(await token.balanceOf(escrow.getAddress())).to.equal('0');
        expect(await token.balanceOf(launcherAddress)).to.equal(
          launcherBalance + ethers.parseEther('100')
        );
      });
    });
  });

  describe('bulkPayOut()', () => {
    const recipients: string[] = [];
    const amounts: bigint[] = [];
    before(async () => {
      recipients.push(await restAccounts[0].getAddress());
      recipients.push(await restAccounts[1].getAddress());
      recipients.push(await restAccounts[2].getAddress());
      amounts.push(ethers.parseEther('10'));
      amounts.push(ethers.parseEther('20'));
      amounts.push(ethers.parseEther('30'));
    });
    beforeEach(async () => {
      await deployEscrow();
      await fundEscrow();
      await setupEscrow();
      await storeResults();
    });
    describe('reverts', function () {
      it('reverts when called by unauthorised address', async function () {
        await expect(
          escrow
            .connect(external)
            [
              'bulkPayOut(address[],uint256[],string,string,uint256)'
            ](recipients, amounts, MOCK_URL, MOCK_HASH, '000')
        ).to.be.revertedWith('Unauthorised');
        await expect(
          escrow
            .connect(exchangeOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,uint256)'
            ](recipients, amounts, MOCK_URL, MOCK_HASH, '000')
        ).to.be.revertedWith('Unauthorised');
        await expect(
          escrow
            .connect(recordingOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,uint256)'
            ](recipients, amounts, MOCK_URL, MOCK_HASH, '000')
        ).to.be.revertedWith('Unauthorised');
        await expect(
          escrow
            .connect(launcher)
            [
              'bulkPayOut(address[],uint256[],string,string,uint256)'
            ](recipients, amounts, MOCK_URL, MOCK_HASH, '000')
        ).to.be.revertedWith('Unauthorised');
      });

      it('reverts when has no funds', async function () {
        escrow.connect(launcher).cancel();
        await expect(
          escrow
            .connect(reputationOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,uint256)'
            ](recipients, amounts, MOCK_URL, MOCK_HASH, '000')
        ).to.be.revertedWith('No funds');
      });

      it('reverts when escrow is expired', async function () {
        await deployEscrow(tokenAddress, launcherAddress, adminAddress, 3);
        await fundEscrow();
        await setupEscrow();
        await expect(
          escrow
            .connect(reputationOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,uint256)'
            ](recipients, amounts, MOCK_URL, MOCK_HASH, '000')
        ).to.be.revertedWith('Expired');
      });

      it('reverts when recipients length don not match amounts length', async function () {
        const recipients = [
          await restAccounts[0].getAddress(),
          await restAccounts[1].getAddress(),
          await restAccounts[2].getAddress(),
        ];
        const amounts = [ethers.parseEther('10'), ethers.parseEther('20')];

        await expect(
          escrow
            .connect(reputationOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,uint256)'
            ](recipients, amounts, MOCK_URL, MOCK_HASH, '000')
        ).to.be.revertedWith('Length mismatch');
      });

      it('reverts when amounts length = 0', async function () {
        const recipients: string[] = [];
        const amounts: number[] = [];

        await expect(
          escrow
            .connect(reputationOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,uint256)'
            ](recipients, amounts, MOCK_URL, MOCK_HASH, '000')
        ).to.be.revertedWith('Empty amounts');
      });

      it('reverts when recipients length >= 100', async function () {
        const recipients = Array.from(
          new Array(BULK_MAX_COUNT + 1),
          () => ethers.ZeroAddress
        );
        const amounts = Array.from({ length: BULK_MAX_COUNT + 1 }, () => 1);

        await expect(
          escrow
            .connect(reputationOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,uint256)'
            ](recipients, amounts, MOCK_URL, MOCK_HASH, '000')
        ).to.be.revertedWith('Too many recipients');
      });

      it('reverts when the url is empty', async function () {
        await expect(
          escrow
            .connect(reputationOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,uint256)'
            ](recipients, amounts, '', MOCK_HASH, '000')
        ).to.be.revertedWith('Empty url/hash');
      });

      it('reverts when the hash is empty', async function () {
        await expect(
          escrow
            .connect(reputationOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,uint256)'
            ](recipients, amounts, MOCK_URL, '', '000')
        ).to.be.revertedWith('Empty url/hash');
      });

      it('reverts when some amount <= 0', async function () {
        const amounts = [
          ethers.parseEther('0'),
          ethers.parseEther('20'),
          ethers.parseEther('30'),
        ];
        await expect(
          escrow
            .connect(reputationOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,uint256)'
            ](recipients, amounts, MOCK_URL, MOCK_HASH, '000')
        ).to.be.revertedWith('Zero amount');
      });

      it('reverts when the sum of amounts > balance', async function () {
        const amounts = [
          ethers.parseEther('100'),
          ethers.parseEther('100'),
          ethers.parseEther('100'),
        ];
        await expect(
          escrow
            .connect(reputationOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,uint256)'
            ](recipients, amounts, MOCK_URL, MOCK_HASH, '000')
        ).to.be.revertedWith('Not enough funds');
      });
    });

    describe('succeeds', function () {
      it('Reputation oracle: executes partial pay out successfully', async function () {
        const initialBalances = await Promise.all(
          recipients.map((r) => token.balanceOf(r))
        );

        const initialOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.connect(owner).balanceOf(oracle))
        );
        await escrow
          .connect(reputationOracle)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256)'
          ](recipients, amounts, MOCK_URL, MOCK_HASH, '000');

        const finalBalances = await Promise.all(
          recipients.map((r) => token.balanceOf(r))
        );
        const finalOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.connect(owner).balanceOf(oracle))
        );

        const totalPayout = amounts.reduce(
          (acc, amount) => acc + BigInt(amount),
          0n
        );
        const oracleExpectedFee = (totalPayout * 3n) / 100n; // 3% fee

        recipients.forEach((_, index) => {
          const expectedAmount = (BigInt(amounts[index]) * 91n) / 100n; // 91% after all 3 oracle fees
          expect(
            (finalBalances[index] - initialBalances[index]).toString()
          ).to.equal(expectedAmount.toString());
        });

        initialOracleBalances.forEach((initialBalance, index) => {
          expect(
            (finalOracleBalances[index] - initialBalance).toString()
          ).to.equal(oracleExpectedFee.toString());
        });

        expect(await escrow.remainingFunds()).to.equal(
          await escrow.getBalance()
        );
        expect(await escrow.status()).to.equal(Status.Partial);
      });

      it('Reputation oracle: executes full pay out successfully', async function () {
        const amounts = [
          ethers.parseEther('40'),
          ethers.parseEther('30'),
          ethers.parseEther('30'),
        ];
        const initialBalances = await Promise.all(
          recipients.map((r) => token.balanceOf(r))
        );
        const initialOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.connect(owner).balanceOf(oracle))
        );
        await escrow
          .connect(reputationOracle)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256)'
          ](recipients, amounts, MOCK_URL, MOCK_HASH, '000');

        const finalBalances = await Promise.all(
          recipients.map((r) => token.balanceOf(r))
        );
        const finalOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.connect(owner).balanceOf(oracle))
        );

        const totalPayout = amounts.reduce(
          (acc, amount) => acc + BigInt(amount),
          0n
        );
        const oracleExpectedFee = (totalPayout * 3n) / 100n; // 3% fee

        recipients.forEach((_, index) => {
          const expectedAmount = (BigInt(amounts[index]) * 91n) / 100n; // 91% after all 3 oracle fees
          expect(
            (finalBalances[index] - initialBalances[index]).toString()
          ).to.equal(expectedAmount.toString());
        });

        initialOracleBalances.forEach((initialBalance, index) => {
          expect(
            (finalOracleBalances[index] - initialBalance).toString()
          ).to.equal(oracleExpectedFee.toString());
        });

        expect(await escrow.remainingFunds()).to.equal(
          await escrow.getBalance()
        );
        expect(await escrow.status()).to.equal(Status.Complete);
      });

      it('Reputation oracle: executes pay out successfully and forces complete', async function () {
        const initialBalances = await Promise.all(
          recipients.map((r) => token.balanceOf(r))
        );
        const initialOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.connect(owner).balanceOf(oracle))
        );
        const launcherInitialBalance = await token.balanceOf(launcherAddress);
        await escrow
          .connect(reputationOracle)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256,bool)'
          ](recipients, amounts, MOCK_URL, MOCK_HASH, '000', true);

        const finalBalances = await Promise.all(
          recipients.map((r) => token.balanceOf(r))
        );
        const finalOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.connect(owner).balanceOf(oracle))
        );

        const totalPayout = amounts.reduce(
          (acc, amount) => acc + BigInt(amount),
          0n
        );
        const oracleExpectedFee = (totalPayout * 3n) / 100n; // 3% fee

        recipients.forEach((_, index) => {
          const expectedAmount = (BigInt(amounts[index]) * 91n) / 100n; // 91% after all 3 oracle fees
          expect(
            (finalBalances[index] - initialBalances[index]).toString()
          ).to.equal(expectedAmount.toString());
        });

        initialOracleBalances.forEach((initialBalance, index) => {
          expect(
            (finalOracleBalances[index] - initialBalance).toString()
          ).to.equal(oracleExpectedFee.toString());
        });

        expect(await escrow.remainingFunds()).to.equal(
          await escrow.getBalance()
        );
        expect(await escrow.status()).to.equal(Status.Complete);

        const launcherFinalBalance = await token.balanceOf(launcherAddress);
        expect(launcherFinalBalance).to.equal(
          launcherInitialBalance + (ethers.parseEther('100') - totalPayout)
        );
      });

      it('Admin: executes partial pay out successfully', async function () {
        const initialBalances = await Promise.all(
          recipients.map((r) => token.balanceOf(r))
        );

        const initialOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.connect(owner).balanceOf(oracle))
        );
        await escrow
          .connect(admin)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256)'
          ](recipients, amounts, MOCK_URL, MOCK_HASH, '000');

        const finalBalances = await Promise.all(
          recipients.map((r) => token.balanceOf(r))
        );
        const finalOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.connect(owner).balanceOf(oracle))
        );

        const totalPayout = amounts.reduce(
          (acc, amount) => acc + BigInt(amount),
          0n
        );
        const oracleExpectedFee = (totalPayout * 3n) / 100n; // 3% fee

        recipients.forEach((_, index) => {
          const expectedAmount = (BigInt(amounts[index]) * 91n) / 100n; // 91% after all 3 oracle fees
          expect(
            (finalBalances[index] - initialBalances[index]).toString()
          ).to.equal(expectedAmount.toString());
        });

        initialOracleBalances.forEach((initialBalance, index) => {
          expect(
            (finalOracleBalances[index] - initialBalance).toString()
          ).to.equal(oracleExpectedFee.toString());
        });

        expect(await escrow.remainingFunds()).to.equal(
          await escrow.getBalance()
        );
        expect(await escrow.status()).to.equal(Status.Partial);
      });

      it('Admin: executes full pay out successfully', async function () {
        const amounts = [
          ethers.parseEther('40'),
          ethers.parseEther('30'),
          ethers.parseEther('30'),
        ];
        const initialBalances = await Promise.all(
          recipients.map((r) => token.balanceOf(r))
        );
        const initialOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.connect(owner).balanceOf(oracle))
        );
        await escrow
          .connect(admin)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256)'
          ](recipients, amounts, MOCK_URL, MOCK_HASH, '000');

        const finalBalances = await Promise.all(
          recipients.map((r) => token.balanceOf(r))
        );
        const finalOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.connect(owner).balanceOf(oracle))
        );

        const totalPayout = amounts.reduce(
          (acc, amount) => acc + BigInt(amount),
          0n
        );
        const oracleExpectedFee = (totalPayout * 3n) / 100n; // 3% fee

        recipients.forEach((_, index) => {
          const expectedAmount = (BigInt(amounts[index]) * 91n) / 100n; // 91% after all 3 oracle fees
          expect(
            (finalBalances[index] - initialBalances[index]).toString()
          ).to.equal(expectedAmount.toString());
        });

        initialOracleBalances.forEach((initialBalance, index) => {
          expect(
            (finalOracleBalances[index] - initialBalance).toString()
          ).to.equal(oracleExpectedFee.toString());
        });

        expect(await escrow.remainingFunds()).to.equal(
          await escrow.getBalance()
        );
        expect(await escrow.status()).to.equal(Status.Complete);
      });

      it('Admin: executes pay out successfully and forces complete', async function () {
        const initialBalances = await Promise.all(
          recipients.map((r) => token.balanceOf(r))
        );
        const initialOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.connect(owner).balanceOf(oracle))
        );
        const launcherInitialBalance = await token.balanceOf(launcherAddress);
        await escrow
          .connect(admin)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256,bool)'
          ](recipients, amounts, MOCK_URL, MOCK_HASH, '000', true);

        const finalBalances = await Promise.all(
          recipients.map((r) => token.balanceOf(r))
        );
        const finalOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.connect(owner).balanceOf(oracle))
        );

        const totalPayout = amounts.reduce(
          (acc, amount) => acc + BigInt(amount),
          0n
        );
        const oracleExpectedFee = (totalPayout * 3n) / 100n; // 3% fee

        recipients.forEach((_, index) => {
          const expectedAmount = (BigInt(amounts[index]) * 91n) / 100n; // 91% after all 3 oracle fees
          expect(
            (finalBalances[index] - initialBalances[index]).toString()
          ).to.equal(expectedAmount.toString());
        });

        initialOracleBalances.forEach((initialBalance, index) => {
          expect(
            (finalOracleBalances[index] - initialBalance).toString()
          ).to.equal(oracleExpectedFee.toString());
        });

        expect(await escrow.remainingFunds()).to.equal(
          await escrow.getBalance()
        );
        expect(await escrow.status()).to.equal(Status.Complete);

        const launcherFinalBalance = await token.balanceOf(launcherAddress);
        expect(launcherFinalBalance).to.equal(
          launcherInitialBalance + (ethers.parseEther('100') - totalPayout)
        );
      });
    });
  });

  describe('complete()', () => {
    beforeEach(async () => {
      await deployEscrow();
      await fundEscrow();
      await setupEscrow();
    });
    describe('reverts', function () {
      it('reverts when status is not Paid or Partial', async function () {
        await expect(
          escrow.connect(reputationOracle).complete()
        ).to.be.revertedWith('Invalid status');
      });

      it('reverts when called by unauthorised address', async function () {
        await expect(escrow.connect(launcher).complete()).to.be.revertedWith(
          'Unauthorised'
        );

        await expect(
          escrow.connect(exchangeOracle).complete()
        ).to.be.revertedWith('Unauthorised');

        await expect(
          escrow.connect(recordingOracle).complete()
        ).to.be.revertedWith('Unauthorised');
      });
    });

    describe('succeeds', function () {
      it('Reputation oracle: completes the escrow successfully', async function () {
        const recipients = [await restAccounts[0].getAddress()];
        const amounts = [ethers.parseEther('10')];

        const initialLauncherBalance = await token.balanceOf(launcherAddress);
        const initialEscrowBalance = await token.balanceOf(escrow.getAddress());

        await escrow
          .connect(reputationOracle)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256,bool)'
          ](recipients, amounts, MOCK_URL, MOCK_HASH, '000', false);

        await expect(escrow.connect(reputationOracle).complete()).to.emit(
          escrow,
          'Completed'
        );

        expect(await escrow.status()).to.equal(Status.Complete);
        expect(await escrow.remainingFunds()).to.equal('0');

        const finalLauncherBalance = await token.balanceOf(launcherAddress);

        expect(finalLauncherBalance - initialLauncherBalance).to.equal(
          initialEscrowBalance - amounts[0]
        );
      });

      it('Admin: completes the escrow successfully', async function () {
        const recipients = [await restAccounts[0].getAddress()];
        const amounts = [ethers.parseEther('10')];

        const initialLauncherBalance = await token.balanceOf(launcherAddress);
        const initialEscrowBalance = await token.balanceOf(escrow.getAddress());

        await escrow
          .connect(reputationOracle)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256,bool)'
          ](recipients, amounts, MOCK_URL, MOCK_HASH, '000', false);

        await expect(escrow.connect(reputationOracle).complete()).to.emit(
          escrow,
          'Completed'
        );

        expect(await escrow.status()).to.equal(Status.Complete);
        expect(await escrow.remainingFunds()).to.equal('0');

        const finalLauncherBalance = await token.balanceOf(launcherAddress);

        expect(finalLauncherBalance - initialLauncherBalance).to.equal(
          initialEscrowBalance - amounts[0]
        );
      });
    });
  });
});
