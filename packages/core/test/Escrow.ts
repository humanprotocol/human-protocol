import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Signer, ZeroAddress } from 'ethers';
import { Escrow, HMToken, KVStore } from '../typechain-types';
import { faker } from '@faker-js/faker';

const BULK_MAX_COUNT = 100;
const STANDARD_DURATION = 100;
const ORACLE_FEE_PERCENTAGE = 3n;

const FIXTURE_URL = faker.internet.url();
const FIXTURE_HASH = faker.string.alphanumeric(10);
const FIXTURE_FUND_AMOUNT = ethers.parseEther('100');

function calculateOracleFee(amount: bigint): bigint {
  return (amount * ORACLE_FEE_PERCENTAGE) / 100n;
}

enum Status {
  Launched = 0,
  Pending = 1,
  Partial = 2,
  Paid = 3,
  Complete = 4,
  Cancelled = 5,
  ToCancel = 6,
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
let token2: HMToken;
let escrow: Escrow;
let kvStore: KVStore;
let tokenAddress: string;
let tokenAddress2: string;
let kvStoreAddress: string;

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
    duration,
    kvStoreAddress
  )) as Escrow;
}

async function fundEscrow(
  amount?: bigint,
  fundToken: HMToken = token
): Promise<bigint> {
  const value = amount ?? FIXTURE_FUND_AMOUNT;
  await fundToken.connect(owner).transfer(await escrow.getAddress(), value);
  return value;
}

async function setupEscrow(
  url: string = FIXTURE_URL,
  hash: string = FIXTURE_HASH
) {
  return await escrow
    .connect(launcher)
    .setup(
      reputationOracleAddress,
      recordingOracleAddress,
      exchangeOracleAddress,
      url,
      hash
    );
}

async function storeResults(
  url: string = FIXTURE_URL,
  hash: string = FIXTURE_HASH,
  reserveAmount = ethers.parseEther('0'),
  signer: Signer = recordingOracle
) {
  return await escrow
    .connect(signer)
    ['storeResults(string,string,uint256)'](url, hash, reserveAmount);
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
    token2 = (await HMToken.deploy(1000000000, 'Token2', 18, 'TK2')) as HMToken;
    tokenAddress2 = await token2.getAddress();

    const KVStore = await ethers.getContractFactory('KVStore');
    kvStore = (await KVStore.deploy()) as KVStore;
    kvStoreAddress = await kvStore.getAddress();

    await kvStore.connect(reputationOracle).set('fee', '3');
    await kvStore.connect(recordingOracle).set('fee', '3');
    await kvStore.connect(exchangeOracle).set('fee', '3');
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
              FIXTURE_URL,
              FIXTURE_HASH
            )
        ).to.be.revertedWith('Unauthorised');
        await expect(
          escrow
            .connect(exchangeOracle)
            .setup(
              reputationOracleAddress,
              recordingOracleAddress,
              exchangeOracleAddress,
              FIXTURE_URL,
              FIXTURE_HASH
            )
        ).to.be.revertedWith('Unauthorised');
        await expect(
          escrow
            .connect(recordingOracle)
            .setup(
              reputationOracleAddress,
              recordingOracleAddress,
              exchangeOracleAddress,
              FIXTURE_URL,
              FIXTURE_HASH
            )
        ).to.be.revertedWith('Unauthorised');
        await expect(
          escrow
            .connect(reputationOracle)
            .setup(
              reputationOracleAddress,
              recordingOracleAddress,
              exchangeOracleAddress,
              FIXTURE_URL,
              FIXTURE_HASH
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
              FIXTURE_URL,
              FIXTURE_HASH
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
              FIXTURE_URL,
              FIXTURE_HASH
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
              FIXTURE_URL,
              FIXTURE_HASH
            )
        ).to.be.revertedWith('Invalid exchange oracle');
      });

      it('reverts when an oracle fee > 25', async () => {
        await kvStore.connect(reputationOracle).set('fee', '50');
        await kvStore.connect(recordingOracle).set('fee', '20');
        await kvStore.connect(exchangeOracle).set('fee', '20');
        await expect(
          escrow
            .connect(launcher)
            .setup(
              reputationOracleAddress,
              recordingOracleAddress,
              exchangeOracleAddress,
              FIXTURE_URL,
              FIXTURE_HASH
            )
        ).to.be.revertedWith('Percentage out of bounds');
        await kvStore.connect(reputationOracle).set('fee', '3');
        await kvStore.connect(recordingOracle).set('fee', '3');
        await kvStore.connect(exchangeOracle).set('fee', '3');
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
              FIXTURE_URL,
              FIXTURE_HASH
            )
        )
          .to.emit(escrow, 'PendingV3')
          .withArgs(
            FIXTURE_URL,
            FIXTURE_HASH,
            reputationOracleAddress,
            recordingOracleAddress,
            exchangeOracleAddress,
            3,
            3,
            3
          )
          .to.emit(escrow, 'Fund')
          .withArgs(amount);

        expect(await escrow.status()).to.equal(Status.Pending);
        expect(await escrow.manifest()).to.equal(FIXTURE_URL);
        expect(await escrow.manifestHash()).to.equal(FIXTURE_HASH);
        expect(await escrow.fundAmount()).to.equal(amount);
        expect(await escrow.remainingFunds()).to.equal(
          amount - calculateOracleFee(amount) * 3n
        );
        expect(await escrow.reservedFunds()).to.equal(0);
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
              FIXTURE_URL,
              FIXTURE_HASH
            )
        )
          .to.emit(escrow, 'PendingV3')
          .withArgs(
            FIXTURE_URL,
            FIXTURE_HASH,
            reputationOracleAddress,
            recordingOracleAddress,
            exchangeOracleAddress,
            3,
            3,
            3
          )
          .to.emit(escrow, 'Fund')
          .withArgs(amount);

        expect(await escrow.status()).to.equal(Status.Pending);
        expect(await escrow.manifest()).to.equal(FIXTURE_URL);
        expect(await escrow.manifestHash()).to.equal(FIXTURE_HASH);
        expect(await escrow.fundAmount()).to.equal(amount);
        expect(await escrow.remainingFunds()).to.equal(
          amount - calculateOracleFee(amount) * 3n
        );
        expect(await escrow.reservedFunds()).to.equal(0);
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
      it('reverts outside Pending/Partial/ToCancel', async () => {
        await escrow.connect(launcher).requestCancellation();
        expect(await escrow.status()).to.equal(Status.ToCancel);
        await storeResults(); //Set cancelled status
        await expect(
          storeResults(FIXTURE_URL, FIXTURE_HASH)
        ).to.be.revertedWith('Invalid status');
      });

      it('reverts with Empty URL', async () => {
        await expect(
          storeResults('', FIXTURE_HASH, FIXTURE_FUND_AMOUNT)
        ).to.be.revertedWith('Empty URL');
      });

      it('reverts with Empty hash', async () => {
        await expect(
          storeResults(FIXTURE_URL, '', FIXTURE_FUND_AMOUNT)
        ).to.be.revertedWith('Empty hash');
      });

      it('reverts when called by unauthorised address', async () => {
        await expect(
          storeResults(
            FIXTURE_URL,
            FIXTURE_HASH,
            ethers.parseEther('0'),
            external
          )
        ).to.be.revertedWith('Unauthorised');
        await expect(
          storeResults(
            FIXTURE_URL,
            FIXTURE_HASH,
            ethers.parseEther('0'),
            launcher
          )
        ).to.be.revertedWith('Unauthorised');
        await expect(
          storeResults(
            FIXTURE_URL,
            FIXTURE_HASH,
            ethers.parseEther('0'),
            reputationOracle
          )
        ).to.be.revertedWith('Unauthorised');
        await expect(
          storeResults(
            FIXTURE_URL,
            FIXTURE_HASH,
            ethers.parseEther('0'),
            exchangeOracle
          )
        ).to.be.revertedWith('Unauthorised');
      });

      it('reverts with DEPRECATED_SIGNATURE', async () => {
        await expect(
          escrow
            .connect(recordingOracle)
            ['storeResults(string,string)'](FIXTURE_URL, FIXTURE_HASH)
        ).to.be.revertedWith('DEPRECATED_SIGNATURE');
      });
    });
    describe('succeeds', () => {
      it('Recording oracle: stores results successfully', async () => {
        const workerFunds = await escrow.remainingFunds();
        await expect(storeResults(FIXTURE_URL, FIXTURE_HASH, workerFunds))
          .to.emit(escrow, 'IntermediateStorage')
          .withArgs(FIXTURE_URL, FIXTURE_HASH);
        expect(await escrow.intermediateResultsUrl()).to.equal(FIXTURE_URL);
        expect(await escrow.reservedFunds()).to.equal(workerFunds);
      });

      it('Recording oracle: stores results successfully and cancels the escrow', async () => {
        const launcherInitialBalance = await token.balanceOf(launcher);
        const workerFunds = await escrow.remainingFunds();
        const initialOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.connect(owner).balanceOf(oracle))
        );

        await escrow.connect(launcher).requestCancellation();
        await expect(storeResults())
          .to.emit(escrow, 'IntermediateStorage')
          .withArgs(FIXTURE_URL, FIXTURE_HASH)
          .to.emit(escrow, 'CancellationRefund')
          .withArgs(workerFunds)
          .to.emit(escrow, 'OracleFeeTransfer')
          .withArgs(
            [
              reputationOracleAddress,
              recordingOracleAddress,
              exchangeOracleAddress,
            ],
            [
              calculateOracleFee(FIXTURE_FUND_AMOUNT),
              calculateOracleFee(FIXTURE_FUND_AMOUNT),
              calculateOracleFee(FIXTURE_FUND_AMOUNT),
            ]
          );

        const finalOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.connect(owner).balanceOf(oracle))
        );
        const oracleExpectedFee = calculateOracleFee(FIXTURE_FUND_AMOUNT);

        expect(await escrow.intermediateResultsUrl()).to.equal(FIXTURE_URL);
        expect(await escrow.status()).to.equal(Status.Cancelled);
        expect(await escrow.remainingFunds()).to.equal(ethers.parseEther('0'));
        expect(await token.balanceOf(launcher)).to.equal(
          launcherInitialBalance + workerFunds
        );
        initialOracleBalances.forEach((initialBalance, index) => {
          expect(finalOracleBalances[index] - initialBalance).to.equal(
            oracleExpectedFee
          );
        });
      });

      it('Admin: stores results successfully', async () => {
        const workerFunds = await escrow.remainingFunds();
        await expect(
          storeResults(FIXTURE_URL, FIXTURE_HASH, workerFunds, admin)
        )
          .to.emit(escrow, 'IntermediateStorage')
          .withArgs(FIXTURE_URL, FIXTURE_HASH);
        expect(await escrow.intermediateResultsUrl()).to.equal(FIXTURE_URL);
        expect(await escrow.reservedFunds()).to.equal(workerFunds);
      });

      it('Recording oracle: stores empty results in ToCancel and cancels without oracle fees', async () => {
        const launcherInitialBalance = await token.balanceOf(launcher);
        const initialEscrowBalance = await token.balanceOf(escrow);
        const initialOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.balanceOf(oracle))
        );

        await escrow.connect(launcher).requestCancellation();
        await expect(storeResults('', '', 0n))
          .to.emit(escrow, 'IntermediateStorage')
          .withArgs('', '')
          .to.emit(escrow, 'CancellationRefund')
          .withArgs(initialEscrowBalance)
          .to.emit(escrow, 'Cancelled');

        const finalOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.balanceOf(oracle))
        );

        expect(await escrow.intermediateResultsUrl()).to.equal('');
        expect(await escrow.status()).to.equal(Status.Cancelled);
        expect(await escrow.remainingFunds()).to.equal(0);
        expect(await token.balanceOf(escrow)).to.equal(0);
        expect(await token.balanceOf(launcher)).to.equal(
          launcherInitialBalance + initialEscrowBalance
        );
        initialOracleBalances.forEach((initialBalance, index) => {
          expect(finalOracleBalances[index]).to.equal(initialBalance);
        });
      });

      it('Admin: stores results successfully and cancels the escrow', async () => {
        const launcherInitialBalance = await token.balanceOf(launcher);
        const workerFunds = await escrow.remainingFunds();
        const initialOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.connect(owner).balanceOf(oracle))
        );

        await escrow.connect(launcher).requestCancellation();
        await expect(
          storeResults(FIXTURE_URL, FIXTURE_HASH, ethers.parseEther('0'), admin)
        )
          .to.emit(escrow, 'IntermediateStorage')
          .withArgs(FIXTURE_URL, FIXTURE_HASH)
          .to.emit(escrow, 'CancellationRefund')
          .withArgs(workerFunds)
          .to.emit(escrow, 'OracleFeeTransfer')
          .withArgs(
            [
              reputationOracleAddress,
              recordingOracleAddress,
              exchangeOracleAddress,
            ],
            [
              calculateOracleFee(FIXTURE_FUND_AMOUNT),
              calculateOracleFee(FIXTURE_FUND_AMOUNT),
              calculateOracleFee(FIXTURE_FUND_AMOUNT),
            ]
          );

        const finalOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.connect(owner).balanceOf(oracle))
        );
        const oracleExpectedFee = calculateOracleFee(FIXTURE_FUND_AMOUNT);

        expect(await escrow.intermediateResultsUrl()).to.equal(FIXTURE_URL);
        expect(await escrow.status()).to.equal(Status.Cancelled);
        expect(await escrow.remainingFunds()).to.equal(ethers.parseEther('0'));
        expect(await token.balanceOf(launcher)).to.equal(
          launcherInitialBalance + workerFunds
        );
        initialOracleBalances.forEach((initialBalance, index) => {
          expect(finalOracleBalances[index] - initialBalance).to.equal(
            oracleExpectedFee
          );
        });
      });
    });
  });

  describe('requestCancellation()', () => {
    beforeEach(async () => {
      await deployEscrow();
      await fundEscrow();
      await setupEscrow();
    });

    describe('reverts', function () {
      it('reverts when called by unauthorised address', async function () {
        await expect(
          escrow.connect(external).requestCancellation()
        ).to.be.revertedWith('Unauthorised');
        await expect(
          escrow.connect(recordingOracle).requestCancellation()
        ).to.be.revertedWith('Unauthorised');
        await expect(
          escrow.connect(exchangeOracle).requestCancellation()
        ).to.be.revertedWith('Unauthorised');
        await expect(
          escrow.connect(reputationOracle).requestCancellation()
        ).to.be.revertedWith('Unauthorised');
      });

      it('reverts when escrow has no funds (complete or cancelled)', async function () {
        const workerFunds = await escrow.remainingFunds();
        await storeResults(FIXTURE_URL, FIXTURE_HASH, workerFunds);
        await escrow
          .connect(admin)
          [
            'bulkPayOut(address[],uint256[],string,string,string,bool)'
          ]([externalAddress], [workerFunds], FIXTURE_URL, FIXTURE_HASH, '000', false);
        await expect(
          escrow.connect(launcher).requestCancellation()
        ).to.be.revertedWith('Invalid status');
      });
    });

    describe('Succeeds', async function () {
      it('Launcher: requests escrow cancellation succesfully', async () => {
        const balance = await token.balanceOf(escrow.getAddress());
        const launcherBalance = await token.balanceOf(launcherAddress);
        await expect(escrow.connect(launcher).requestCancellation()).to.emit(
          escrow,
          'CancellationRequested'
        );
        expect(await escrow.status()).to.equal(Status.ToCancel);

        expect(await token.balanceOf(escrow.getAddress())).to.equal(balance);
        expect(await token.balanceOf(launcherAddress)).to.equal(
          launcherBalance
        );
      });

      it('Launcher: requests escrow cancellation successfully when escrow has reserved funds', async () => {
        const workerFunds = await escrow.remainingFunds();
        await storeResults(FIXTURE_URL, FIXTURE_HASH, workerFunds);

        await expect(escrow.connect(launcher).requestCancellation()).to.emit(
          escrow,
          'CancellationRequested'
        );

        expect(await escrow.status()).to.equal(Status.ToCancel);
      });

      it('Launcher: cancels escrow succesfully when escrow is expired', async () => {
        await deployEscrow(tokenAddress, launcherAddress, adminAddress, 3);
        await fundEscrow();
        await setupEscrow();
        const launcherBalance = await token.balanceOf(launcherAddress);
        const initialOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.balanceOf(oracle))
        );
        await expect(escrow.connect(launcher).requestCancellation()).to.emit(
          escrow,
          'CancellationRequested'
        );
        const finalOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.balanceOf(oracle))
        );
        expect(await escrow.status()).to.equal(Status.Cancelled);

        expect(await token.balanceOf(escrow.getAddress())).to.equal(0);
        expect(await token.balanceOf(launcherAddress)).to.equal(
          launcherBalance + FIXTURE_FUND_AMOUNT
        );
        initialOracleBalances.forEach((initialBalance, index) => {
          expect(finalOracleBalances[index]).to.equal(initialBalance);
        });
      });

      it('Admin: requests escrow cancellation succesfully', async () => {
        const balance = await token.balanceOf(escrow.getAddress());
        const launcherBalance = await token.balanceOf(launcherAddress);
        await expect(escrow.connect(admin).requestCancellation()).to.emit(
          escrow,
          'CancellationRequested'
        );
        expect(await escrow.status()).to.equal(Status.ToCancel);

        expect(await token.balanceOf(escrow.getAddress())).to.equal(balance);
        expect(await token.balanceOf(launcherAddress)).to.equal(
          launcherBalance
        );
      });

      it('Admin: cancels escrow succesfully when escrow is expired', async () => {
        await deployEscrow(tokenAddress, launcherAddress, adminAddress, 3);
        await fundEscrow();
        await setupEscrow();
        const launcherBalance = await token.balanceOf(launcherAddress);
        const initialOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.balanceOf(oracle))
        );
        await expect(escrow.connect(admin).requestCancellation()).to.emit(
          escrow,
          'CancellationRequested'
        );
        const finalOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.balanceOf(oracle))
        );
        expect(await escrow.status()).to.equal(Status.Cancelled);

        expect(await token.balanceOf(escrow.getAddress())).to.equal(0);
        expect(await token.balanceOf(launcherAddress)).to.equal(
          launcherBalance + FIXTURE_FUND_AMOUNT
        );
        initialOracleBalances.forEach((initialBalance, index) => {
          expect(finalOracleBalances[index]).to.equal(initialBalance);
        });
      });

      it('Admin: cancels escrow succesfully when escrow has no funds but status is Launched', async function () {
        await deployEscrow(tokenAddress, launcherAddress, adminAddress, 3);
        await expect(escrow.connect(admin).requestCancellation()).to.emit(
          escrow,
          'CancellationRequested'
        );
        expect(await escrow.status()).to.equal(Status.Cancelled);
        expect(await token.balanceOf(escrow.getAddress())).to.equal(0);
      });

      it('Admin: cancels escrow succesfully when escrow has funds and status is Launched', async function () {
        await deployEscrow(tokenAddress, launcherAddress, adminAddress, 3);
        await fundEscrow();
        const launcherBalance = await token.balanceOf(launcherAddress);
        await expect(escrow.connect(admin).requestCancellation()).to.emit(
          escrow,
          'CancellationRequested'
        );
        expect(await escrow.status()).to.equal(Status.Cancelled);
        expect(await token.balanceOf(escrow.getAddress())).to.equal(0);
        expect(await token.balanceOf(launcherAddress)).to.equal(
          launcherBalance + FIXTURE_FUND_AMOUNT
        );
      });
    });
  });

  describe('withdraw()', () => {
    beforeEach(async () => {
      await deployEscrow();
      await fundEscrow();
      await setupEscrow();
    });

    describe('reverts', function () {
      it('reverts when called by unauthorised address', async function () {
        await expect(
          escrow.connect(external).withdraw(tokenAddress)
        ).to.be.revertedWith('Unauthorised');
        await expect(
          escrow.connect(recordingOracle).withdraw(tokenAddress)
        ).to.be.revertedWith('Unauthorised');
        await expect(
          escrow.connect(exchangeOracle).withdraw(tokenAddress)
        ).to.be.revertedWith('Unauthorised');
        await expect(
          escrow.connect(reputationOracle).withdraw(tokenAddress)
        ).to.be.revertedWith('Unauthorised');
      });

      it('reverts when escrow has no funds', async function () {
        await expect(
          escrow.connect(launcher).withdraw(tokenAddress)
        ).to.be.revertedWith('No funds');
      });

      it('reverts when escrow has no funds of token2', async function () {
        await expect(
          escrow.connect(launcher).withdraw(tokenAddress2)
        ).to.be.revertedWith('No funds');
      });
    });

    describe('Succeeds', async function () {
      const extraAmount = ethers.parseEther('50');
      it('Launcher: withdraws extra funds successfully', async () => {
        const initialBalance = await token.balanceOf(launcherAddress);
        await fundEscrow(extraAmount);
        await expect(escrow.connect(launcher).withdraw(tokenAddress))
          .to.emit(escrow, 'Withdraw')
          .withArgs(tokenAddress, extraAmount);
        expect(await token.balanceOf(launcherAddress)).to.equal(
          initialBalance + extraAmount
        );
      });

      it('Launcher: withdraws extra funds of token2 successfully', async () => {
        const initialBalance = await token2.balanceOf(launcherAddress);
        await fundEscrow(extraAmount, token2);
        await expect(escrow.connect(launcher).withdraw(tokenAddress2))
          .to.emit(escrow, 'Withdraw')
          .withArgs(tokenAddress2, extraAmount);
        expect(await token2.balanceOf(launcherAddress)).to.equal(
          initialBalance + extraAmount
        );
      });

      it('Admin: withdraws extra funds successfully', async () => {
        const initialBalance = await token.balanceOf(adminAddress);
        await fundEscrow(extraAmount);
        await expect(escrow.connect(admin).withdraw(tokenAddress))
          .to.emit(escrow, 'Withdraw')
          .withArgs(tokenAddress, extraAmount);
        expect(await token.balanceOf(adminAddress)).to.equal(
          initialBalance + extraAmount
        );
      });

      it('Admin: withdraws extra funds of token2 successfully', async () => {
        const initialBalance = await token2.balanceOf(adminAddress);
        await fundEscrow(extraAmount, token2);
        await expect(escrow.connect(admin).withdraw(tokenAddress2))
          .to.emit(escrow, 'Withdraw')
          .withArgs(tokenAddress2, extraAmount);
        expect(await token2.balanceOf(adminAddress)).to.equal(
          initialBalance + extraAmount
        );
      });
    });
  });

  describe('bulkPayOut()', () => {
    const recipients: string[] = [];
    const amounts: bigint[] = [];
    let totalAmount: bigint;
    before(async () => {
      recipients.push(await restAccounts[0].getAddress());
      recipients.push(await restAccounts[1].getAddress());
      recipients.push(await restAccounts[2].getAddress());
      amounts.push(ethers.parseEther('10'));
      amounts.push(ethers.parseEther('20'));
      amounts.push(ethers.parseEther('30'));
      totalAmount = amounts.reduce((acc, val) => acc + val, 0n);
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
              'bulkPayOut(address[],uint256[],string,string,string,bool)'
            ](recipients, amounts, FIXTURE_URL, FIXTURE_HASH, '000', false)
        ).to.be.revertedWith('Unauthorised');
        await expect(
          escrow
            .connect(exchangeOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,string,bool)'
            ](recipients, amounts, FIXTURE_URL, FIXTURE_HASH, '000', false)
        ).to.be.revertedWith('Unauthorised');
        await expect(
          escrow
            .connect(recordingOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,string,bool)'
            ](recipients, amounts, FIXTURE_URL, FIXTURE_HASH, '000', false)
        ).to.be.revertedWith('Unauthorised');
        await expect(
          escrow
            .connect(launcher)
            [
              'bulkPayOut(address[],uint256[],string,string,string,bool)'
            ](recipients, amounts, FIXTURE_URL, FIXTURE_HASH, '000', false)
        ).to.be.revertedWith('Unauthorised');
      });

      it('reverts when broke', async function () {
        await escrow.connect(launcher).requestCancellation();
        await storeResults();
        await expect(
          escrow
            .connect(reputationOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,string,bool)'
            ](recipients, amounts, FIXTURE_URL, FIXTURE_HASH, '000', false)
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
              'bulkPayOut(address[],uint256[],string,string,string,bool)'
            ](recipients, amounts, FIXTURE_URL, FIXTURE_HASH, '000', false)
        ).to.be.revertedWith('Expired');
      });

      it('reverts when payoutId exists', async function () {
        await storeResults(
          FIXTURE_URL,
          FIXTURE_HASH,
          await escrow.remainingFunds()
        );
        await escrow
          .connect(reputationOracle)
          [
            'bulkPayOut(address[],uint256[],string,string,string,bool)'
          ](recipients, amounts, FIXTURE_URL, FIXTURE_HASH, '000', false);
        await expect(
          escrow
            .connect(reputationOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,string,bool)'
            ](recipients, amounts, FIXTURE_URL, FIXTURE_HASH, '000', false)
        ).to.be.revertedWith('payoutId already exists');
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
              'bulkPayOut(address[],uint256[],string,string,string,bool)'
            ](recipients, amounts, FIXTURE_URL, FIXTURE_HASH, '000', false)
        ).to.be.revertedWith('Length mismatch');
      });

      it('reverts when amounts length = 0', async function () {
        const recipients: string[] = [];
        const amounts: number[] = [];

        await expect(
          escrow
            .connect(reputationOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,string,bool)'
            ](recipients, amounts, FIXTURE_URL, FIXTURE_HASH, '000', false)
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
              'bulkPayOut(address[],uint256[],string,string,string,bool)'
            ](recipients, amounts, FIXTURE_URL, FIXTURE_HASH, '000', false)
        ).to.be.revertedWith('Too many recipients');
      });

      it('reverts when the url is empty', async function () {
        await expect(
          escrow
            .connect(reputationOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,string,bool)'
            ](recipients, amounts, '', FIXTURE_HASH, '000', false)
        ).to.be.revertedWith('Empty url/hash');
      });

      it('reverts when the hash is empty', async function () {
        await expect(
          escrow
            .connect(reputationOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,string,bool)'
            ](recipients, amounts, FIXTURE_URL, '', '000', false)
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
              'bulkPayOut(address[],uint256[],string,string,string,bool)'
            ](recipients, amounts, FIXTURE_URL, FIXTURE_HASH, '000', false)
        ).to.be.revertedWith('Zero amount');
      });

      it('reverts when the sum of amounts > reservedFunds', async function () {
        const amounts = [
          FIXTURE_FUND_AMOUNT,
          FIXTURE_FUND_AMOUNT,
          FIXTURE_FUND_AMOUNT,
        ];
        await expect(
          escrow
            .connect(reputationOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,string,bool)'
            ](recipients, amounts, FIXTURE_URL, FIXTURE_HASH, '000', false)
        ).to.be.revertedWith('Not enough funds');
      });

      it('reverts with DEPRECATED_SIGNATURE', async () => {
        await expect(
          escrow
            .connect(recordingOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,uint256,bool)'
            ](recipients, amounts, FIXTURE_URL, FIXTURE_HASH, '1', false)
        ).to.be.revertedWith('DEPRECATED_SIGNATURE');
      });
    });

    describe('succeeds', function () {
      it('Reputation oracle: executes partial pay out successfully', async function () {
        const initialBalances = await Promise.all(
          recipients.map((r) => token.balanceOf(r))
        );
        const workerFunds = await escrow.remainingFunds();

        await storeResults(FIXTURE_URL, FIXTURE_HASH, totalAmount);
        await expect(
          escrow
            .connect(reputationOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,string,bool)'
            ](recipients, amounts, FIXTURE_URL, FIXTURE_HASH, '000', false)
        ).to.emit(escrow, 'BulkTransferV3');

        const finalBalances = await Promise.all(
          recipients.map((r) => token.balanceOf(r))
        );
        recipients.forEach((_, index) => {
          const expectedAmount = BigInt(amounts[index]);
          expect(
            (finalBalances[index] - initialBalances[index]).toString()
          ).to.equal(expectedAmount.toString());
        });

        expect(await escrow.remainingFunds()).to.equal(
          workerFunds - totalAmount
        );
        expect(await escrow.status()).to.equal(Status.Partial);
      });

      it('Reputation oracle: executes full pay out successfully', async function () {
        const amounts = [
          ethers.parseEther('40'),
          ethers.parseEther('30'),
          ethers.parseEther('21'),
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

        const totalPayout = amounts.reduce(
          (acc, amount) => acc + BigInt(amount),
          0n
        );

        await storeResults(FIXTURE_URL, FIXTURE_HASH, totalPayout);

        await expect(
          escrow
            .connect(reputationOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,string,bool)'
            ](recipients, amounts, FIXTURE_URL, FIXTURE_HASH, '000', false)
        )
          .to.emit(escrow, 'BulkTransferV3')
          .to.emit(escrow, 'OracleFeeTransfer')
          .withArgs(
            [
              reputationOracleAddress,
              recordingOracleAddress,
              exchangeOracleAddress,
            ],
            [
              calculateOracleFee(FIXTURE_FUND_AMOUNT),
              calculateOracleFee(FIXTURE_FUND_AMOUNT),
              calculateOracleFee(FIXTURE_FUND_AMOUNT),
            ]
          );

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

        const oracleExpectedFee = calculateOracleFee(FIXTURE_FUND_AMOUNT);

        recipients.forEach((_, index) => {
          const expectedAmount = BigInt(amounts[index]);
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

        await storeResults(FIXTURE_URL, FIXTURE_HASH, totalAmount);

        await expect(
          escrow
            .connect(reputationOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,string,bool)'
            ](recipients, amounts, FIXTURE_URL, FIXTURE_HASH, '000', true)
        ).to.emit(escrow, 'BulkTransferV3');

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

        const oracleExpectedFee = calculateOracleFee(FIXTURE_FUND_AMOUNT);

        recipients.forEach((_, index) => {
          const expectedAmount = BigInt(amounts[index]);
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
          launcherInitialBalance +
            FIXTURE_FUND_AMOUNT -
            calculateOracleFee(FIXTURE_FUND_AMOUNT) * 3n -
            totalAmount
        );
      });

      it('Reputation oracle: executes partial pay out and cancels successfully', async function () {
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

        await escrow.connect(launcher).requestCancellation();

        const workerFunds = await escrow.remainingFunds();
        const storeResultsTx = await storeResults(
          FIXTURE_URL,
          FIXTURE_HASH,
          totalAmount
        );
        await expect(storeResultsTx)
          .to.emit(escrow, 'CancellationRefund')
          .withArgs(workerFunds - totalAmount);
        await expect(
          escrow
            .connect(reputationOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,string,bool)'
            ](recipients, amounts, FIXTURE_URL, FIXTURE_HASH, '000', false)
        ).to.emit(escrow, 'BulkTransferV3');

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

        const oracleExpectedFee = calculateOracleFee(FIXTURE_FUND_AMOUNT);

        recipients.forEach((_, index) => {
          const expectedAmount = BigInt(amounts[index]);
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
        expect(await escrow.status()).to.equal(Status.Cancelled);
      });

      it('Admin: executes partial pay out successfully', async function () {
        const initialBalances = await Promise.all(
          recipients.map((r) => token.balanceOf(r))
        );
        const workerFunds = await escrow.remainingFunds();

        await storeResults(FIXTURE_URL, FIXTURE_HASH, totalAmount);

        await expect(
          escrow
            .connect(admin)
            [
              'bulkPayOut(address[],uint256[],string,string,string,bool)'
            ](recipients, amounts, FIXTURE_URL, FIXTURE_HASH, '000', false)
        ).to.emit(escrow, 'BulkTransferV3');

        const finalBalances = await Promise.all(
          recipients.map((r) => token.balanceOf(r))
        );

        recipients.forEach((_, index) => {
          const expectedAmount = BigInt(amounts[index]);
          expect(
            (finalBalances[index] - initialBalances[index]).toString()
          ).to.equal(expectedAmount.toString());
        });

        expect(await escrow.remainingFunds()).to.equal(
          workerFunds - totalAmount
        );
        expect(await escrow.status()).to.equal(Status.Partial);
      });

      it('Admin: executes full pay out successfully', async function () {
        const amounts = [
          ethers.parseEther('40'),
          ethers.parseEther('30'),
          ethers.parseEther('21'),
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

        const totalPayout = amounts.reduce(
          (acc, amount) => acc + BigInt(amount),
          0n
        );

        await storeResults(FIXTURE_URL, FIXTURE_HASH, totalPayout);

        await expect(
          escrow
            .connect(admin)
            [
              'bulkPayOut(address[],uint256[],string,string,string,bool)'
            ](recipients, amounts, FIXTURE_URL, FIXTURE_HASH, '000', false)
        ).to.emit(escrow, 'BulkTransferV3');

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

        const oracleExpectedFee = calculateOracleFee(FIXTURE_FUND_AMOUNT);

        recipients.forEach((_, index) => {
          const expectedAmount = BigInt(amounts[index]);
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

        await storeResults(FIXTURE_URL, FIXTURE_HASH, totalAmount);

        await expect(
          escrow
            .connect(admin)
            [
              'bulkPayOut(address[],uint256[],string,string,string,bool)'
            ](recipients, amounts, FIXTURE_URL, FIXTURE_HASH, '000', true)
        ).to.emit(escrow, 'BulkTransferV3');

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

        const oracleExpectedFee = calculateOracleFee(FIXTURE_FUND_AMOUNT);

        recipients.forEach((_, index) => {
          const expectedAmount = BigInt(amounts[index]);
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
          launcherInitialBalance +
            FIXTURE_FUND_AMOUNT -
            calculateOracleFee(FIXTURE_FUND_AMOUNT) * 3n -
            totalAmount
        );
      });

      it('Admin: executes partial pay out and cancels successfully', async function () {
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

        await escrow.connect(launcher).requestCancellation();

        await storeResults(FIXTURE_URL, FIXTURE_HASH, totalAmount);
        await expect(
          escrow
            .connect(admin)
            [
              'bulkPayOut(address[],uint256[],string,string,string,bool)'
            ](recipients, amounts, FIXTURE_URL, FIXTURE_HASH, '000', false)
        ).to.emit(escrow, 'BulkTransferV3');

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

        const oracleExpectedFee = calculateOracleFee(FIXTURE_FUND_AMOUNT);

        recipients.forEach((_, index) => {
          const expectedAmount = BigInt(amounts[index]);
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
        expect(await escrow.status()).to.equal(Status.Cancelled);
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
      it('reverts when status is not Paid or Partial or intermediate results does not exist', async function () {
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

      it('reverts when intermediate results exist but reserved funds is not 0', async function () {
        storeResults();
        await expect(
          escrow.connect(reputationOracle).complete()
        ).to.be.revertedWith('Invalid status');
      });
    });

    describe('succeeds', function () {
      it('Reputation oracle: completes the escrow successfully', async function () {
        const recipients = [await restAccounts[0].getAddress()];
        const amounts = [ethers.parseEther('10')];

        const initialLauncherBalance = await token.balanceOf(launcherAddress);
        const initialRecipientBalance = await token.balanceOf(recipients[0]);
        const initialOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.connect(owner).balanceOf(oracle))
        );
        const initialEscrowBalance = await token.balanceOf(escrow.getAddress());

        await storeResults(FIXTURE_URL, FIXTURE_HASH, amounts[0]);
        await escrow
          .connect(reputationOracle)
          [
            'bulkPayOut(address[],uint256[],string,string,string,bool)'
          ](recipients, amounts, FIXTURE_URL, FIXTURE_HASH, '000', false);

        await expect(escrow.connect(reputationOracle).complete()).to.emit(
          escrow,
          'Completed'
        );

        expect(await escrow.status()).to.equal(Status.Complete);
        expect(await escrow.remainingFunds()).to.equal('0');

        const finalLauncherBalance = await token.balanceOf(launcherAddress);
        const finalRecipientBalance = await token.balanceOf(recipients[0]);
        const finalOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.connect(owner).balanceOf(oracle))
        );

        expect(finalRecipientBalance - initialRecipientBalance).to.equal(
          amounts[0]
        );
        initialOracleBalances.forEach((initialBalance, index) => {
          expect(finalOracleBalances[index] - initialBalance).to.equal(
            calculateOracleFee(initialEscrowBalance)
          );
        });
        expect(finalLauncherBalance - initialLauncherBalance).to.equal(
          initialEscrowBalance -
            calculateOracleFee(initialEscrowBalance) * 3n -
            amounts[0]
        );
      });

      it('Admin: completes the escrow successfully', async function () {
        const recipients = [await restAccounts[0].getAddress()];
        const amounts = [ethers.parseEther('10')];

        const initialLauncherBalance = await token.balanceOf(launcherAddress);
        const initialEscrowBalance = await token.balanceOf(escrow.getAddress());
        await storeResults(FIXTURE_URL, FIXTURE_HASH, amounts[0]);
        await escrow
          .connect(reputationOracle)
          [
            'bulkPayOut(address[],uint256[],string,string,string,bool)'
          ](recipients, amounts, FIXTURE_URL, FIXTURE_HASH, '000', false);

        await expect(escrow.connect(reputationOracle).complete()).to.emit(
          escrow,
          'Completed'
        );

        expect(await escrow.status()).to.equal(Status.Complete);
        expect(await escrow.remainingFunds()).to.equal('0');

        const finalLauncherBalance = await token.balanceOf(launcherAddress);

        expect(finalLauncherBalance - initialLauncherBalance).to.equal(
          initialEscrowBalance -
            calculateOracleFee(initialEscrowBalance) * 3n -
            amounts[0]
        );
      });

      it('Reputation oracle: completes the escrow successfully without payouts', async function () {
        const initialLauncherBalance = await token.balanceOf(launcherAddress);
        const initialEscrowBalance = await token.balanceOf(escrow.getAddress());
        const initialOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.balanceOf(oracle))
        );

        await storeResults(FIXTURE_URL, FIXTURE_HASH, 0n);

        await expect(escrow.connect(reputationOracle).complete())
          .to.emit(escrow, 'OracleFeeTransfer')
          .withArgs(
            [
              reputationOracleAddress,
              recordingOracleAddress,
              exchangeOracleAddress,
            ],
            [
              calculateOracleFee(initialEscrowBalance),
              calculateOracleFee(initialEscrowBalance),
              calculateOracleFee(initialEscrowBalance),
            ]
          )
          .to.emit(escrow, 'Completed');

        expect(await escrow.status()).to.equal(Status.Complete);
        expect(await escrow.remainingFunds()).to.equal('0');

        const finalLauncherBalance = await token.balanceOf(launcherAddress);
        const finalOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.balanceOf(oracle))
        );

        expect(finalLauncherBalance - initialLauncherBalance).to.equal(
          initialEscrowBalance - calculateOracleFee(initialEscrowBalance) * 3n
        );
        initialOracleBalances.forEach((initialBalance, index) => {
          expect(finalOracleBalances[index] - initialBalance).to.equal(
            calculateOracleFee(initialEscrowBalance)
          );
        });
      });

      it('Admin: completes the escrow successfully without payouts', async function () {
        const initialLauncherBalance = await token.balanceOf(launcherAddress);
        const initialEscrowBalance = await token.balanceOf(escrow.getAddress());
        const initialOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.balanceOf(oracle))
        );

        await storeResults(FIXTURE_URL, FIXTURE_HASH, 0n);

        await expect(escrow.connect(admin).complete())
          .to.emit(escrow, 'OracleFeeTransfer')
          .withArgs(
            [
              reputationOracleAddress,
              recordingOracleAddress,
              exchangeOracleAddress,
            ],
            [
              calculateOracleFee(initialEscrowBalance),
              calculateOracleFee(initialEscrowBalance),
              calculateOracleFee(initialEscrowBalance),
            ]
          )
          .to.emit(escrow, 'Completed');

        expect(await escrow.status()).to.equal(Status.Complete);
        expect(await escrow.remainingFunds()).to.equal('0');

        const finalLauncherBalance = await token.balanceOf(launcherAddress);
        const finalOracleBalances = await Promise.all(
          [
            recordingOracleAddress,
            reputationOracleAddress,
            exchangeOracleAddress,
          ].map(async (oracle) => token.balanceOf(oracle))
        );

        expect(finalLauncherBalance - initialLauncherBalance).to.equal(
          initialEscrowBalance - calculateOracleFee(initialEscrowBalance) * 3n
        );
        initialOracleBalances.forEach((initialBalance, index) => {
          expect(finalOracleBalances[index] - initialBalance).to.equal(
            calculateOracleFee(initialEscrowBalance)
          );
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
          await escrow.connect(launcher).requestCancellation();

          await expect(escrow.connect(external).cancel()).to.be.revertedWith(
            'Unauthorised'
          );
          await expect(
            escrow.connect(recordingOracle).cancel()
          ).to.be.revertedWith('Unauthorised');
          await expect(
            escrow.connect(exchangeOracle).cancel()
          ).to.be.revertedWith('Unauthorised');
          await expect(escrow.connect(launcher).cancel()).to.be.revertedWith(
            'Unauthorised'
          );
        });

        it('reverts when the status is not ToCancel', async function () {
          await expect(
            escrow.connect(reputationOracle).cancel()
          ).to.be.revertedWith('Invalid status');
        });

        it('reverts when escrow has reserved funds', async function () {
          const workerFunds = await escrow.remainingFunds();
          await storeResults(FIXTURE_URL, FIXTURE_HASH, workerFunds);
          await escrow.connect(launcher).requestCancellation();

          await expect(
            escrow.connect(reputationOracle).cancel()
          ).to.be.revertedWith('Reserved funds');
        });

        it('reverts when escrow has reserved funds after a partial payout', async function () {
          const workerFunds = await escrow.remainingFunds();
          const payoutAmount = workerFunds / 2n;
          await storeResults(FIXTURE_URL, FIXTURE_HASH, workerFunds);
          await escrow.connect(launcher).requestCancellation();
          await escrow
            .connect(admin)
            [
              'bulkPayOut(address[],uint256[],string,string,string,bool)'
            ]([externalAddress], [payoutAmount], FIXTURE_URL, FIXTURE_HASH, '000', false);

          await expect(escrow.connect(admin).cancel()).to.be.revertedWith(
            'Reserved funds'
          );
        });
      });

      describe('Succeeds', async function () {
        beforeEach(async () => {
          await escrow.connect(launcher).requestCancellation();
        });

        it('Reputation oracle: cancels the escrow succesfully', async () => {
          const initialLauncherBalance = await token.balanceOf(launcherAddress);
          const initialEscrowBalance = await token.balanceOf(
            escrow.getAddress()
          );
          const initialOracleBalances = await Promise.all(
            [
              recordingOracleAddress,
              reputationOracleAddress,
              exchangeOracleAddress,
            ].map(async (oracle) => token.balanceOf(oracle))
          );

          await expect(escrow.connect(reputationOracle).cancel())
            .to.emit(escrow, 'CancellationRefund')
            .withArgs(initialEscrowBalance)
            .to.emit(escrow, 'Cancelled');

          expect(await escrow.status()).to.equal(Status.Cancelled);

          expect(await escrow.remainingFunds()).to.equal('0');

          const finalLauncherBalance = await token.balanceOf(launcherAddress);

          expect(finalLauncherBalance - initialLauncherBalance).to.equal(
            initialEscrowBalance
          );
          const finalOracleBalances = await Promise.all(
            [
              recordingOracleAddress,
              reputationOracleAddress,
              exchangeOracleAddress,
            ].map(async (oracle) => token.balanceOf(oracle))
          );
          initialOracleBalances.forEach((initialBalance, index) => {
            expect(finalOracleBalances[index]).to.equal(initialBalance);
          });
        });

        it('Admin: cancels the escrow succesfully', async () => {
          const initialLauncherBalance = await token.balanceOf(launcherAddress);
          const initialEscrowBalance = await token.balanceOf(
            escrow.getAddress()
          );
          const initialOracleBalances = await Promise.all(
            [
              recordingOracleAddress,
              reputationOracleAddress,
              exchangeOracleAddress,
            ].map(async (oracle) => token.balanceOf(oracle))
          );

          await expect(escrow.connect(admin).cancel())
            .to.emit(escrow, 'CancellationRefund')
            .withArgs(initialEscrowBalance)
            .to.emit(escrow, 'Cancelled');

          expect(await escrow.status()).to.equal(Status.Cancelled);

          expect(await escrow.remainingFunds()).to.equal('0');

          const finalLauncherBalance = await token.balanceOf(launcherAddress);

          expect(finalLauncherBalance - initialLauncherBalance).to.equal(
            initialEscrowBalance
          );
          const finalOracleBalances = await Promise.all(
            [
              recordingOracleAddress,
              reputationOracleAddress,
              exchangeOracleAddress,
            ].map(async (oracle) => token.balanceOf(oracle))
          );
          initialOracleBalances.forEach((initialBalance, index) => {
            expect(finalOracleBalances[index]).to.equal(initialBalance);
          });
        });
      });
    });
  });
});
