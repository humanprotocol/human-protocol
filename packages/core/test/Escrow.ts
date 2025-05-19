/* eslint-disable @typescript-eslint/no-explicit-any */
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { EventLog, Signer } from 'ethers';
import { Escrow, HMToken } from '../typechain-types';

const MOCK_URL = 'http://google.com/fake';
const MOCK_HASH = 'kGKmnj9BRf';
const BULK_MAX_COUNT = 100;

enum Status {
  Launched = 0,
  Pending = 1,
  Partial = 2,
  Paid = 3,
  Complete = 4,
  Cancelled = 5,
  ToCancel = 6,
}

let owner: Signer,
  launcher: Signer,
  reputationOracle: Signer,
  recordingOracle: Signer,
  exchangeOracle: Signer,
  externalAddress: Signer,
  restAccounts: Signer[],
  trustedHandlers: Signer[];

let token: HMToken, escrow: Escrow;

async function deployEscrow() {
  // Deploy Escrow Contract
  const Escrow = await ethers.getContractFactory('contracts/Escrow.sol:Escrow');
  escrow = (await Escrow.deploy(
    await token.getAddress(),
    await launcher.getAddress(),
    await owner.getAddress(),
    100,
    await Promise.all(
      trustedHandlers.map(async (handler) => await handler.getAddress())
    )
  )) as Escrow;
}

async function setupEscrow() {
  await escrow
    .connect(owner)
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
}

async function fundEscrow() {
  const amount = 100;
  await token.connect(owner).transfer(escrow.getAddress(), amount);
}

async function storeResults(amount = 50) {
  await escrow
    .connect(restAccounts[0])
    .storeResults(MOCK_URL, MOCK_HASH, amount);
}

describe('Escrow', function () {
  this.beforeAll(async () => {
    [
      owner,
      launcher,
      reputationOracle,
      recordingOracle,
      exchangeOracle,
      externalAddress,
      ...restAccounts
    ] = await ethers.getSigners();

    trustedHandlers = [restAccounts[0], restAccounts[1]];

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
  });

  describe('deployment', () => {
    before(async () => {
      await deployEscrow();
    });

    it('Should set the right token address', async () => {
      const result = await escrow.token();
      expect(result).to.equal(await token.getAddress());
    });

    it('Should set the right launched status', async () => {
      const result = await escrow.status();
      expect(result).to.equal(Status.Launched);
    });

    it('Should set the right escrow balance', async () => {
      const result = await escrow.connect(launcher).getBalance();
      expect(result.toString()).to.equal('0');
    });

    it('Should set the right contract creator', async () => {
      const result = await escrow.launcher();
      expect(result).to.equal(await launcher.getAddress());
    });

    it('Should set the right escrow factory contract', async () => {
      const result = await escrow.escrowFactory();
      expect(result).to.equal(await owner.getAddress());
    });

    it('Should topup and return the right escrow balance', async () => {
      const amount = 1000;
      await token.connect(owner).transfer(escrow.getAddress(), amount);

      const result = await escrow.connect(launcher).getBalance();
      expect(result).to.equal(amount.toString());
    });
  });

  describe('addTrustedHandlers', async () => {
    before(async () => {
      await deployEscrow();
      await fundEscrow();
      await setupEscrow();
    });

    describe('Validations', function () {
      it('Should revert with the right error if caller cannot add trusted handlers', async function () {
        await expect(
          escrow
            .connect(externalAddress)
            .addTrustedHandlers([await reputationOracle.getAddress()])
        ).to.be.revertedWith('Address calling not trusted');
      });

      it('Should revert when adding trusted handlers from reputation oracle', async function () {
        await expect(
          escrow
            .connect(reputationOracle)
            .addTrustedHandlers([await externalAddress.getAddress()])
        ).to.be.revertedWith('Address calling not trusted');
      });

      it('Should revert when adding trusted handlers from recording oracle', async function () {
        await expect(
          escrow
            .connect(recordingOracle)
            .addTrustedHandlers([await externalAddress.getAddress()])
        ).to.be.revertedWith('Address calling not trusted');
      });
    });

    describe('Add trusted handlers', async function () {
      it('Should succeed when the contract launcher address trusted handlers and a trusted handler stores results', async () => {
        await escrow
          .connect(owner)
          .addTrustedHandlers([await restAccounts[2].getAddress()]);

        const result = await (
          await escrow
            .connect(restAccounts[2])
            .storeResults(MOCK_URL, MOCK_HASH, 50)
        ).wait();

        expect((result?.logs[0] as EventLog).args).to.contain(MOCK_URL);
        expect((result?.logs[0] as EventLog).args).to.contain(MOCK_HASH);
      });

      it('Should succeed when add a new trusted handler from trusted handler and a trusted handler stores results', async () => {
        await escrow
          .connect(trustedHandlers[0])
          .addTrustedHandlers([await restAccounts[3].getAddress()]);

        const result = await (
          await escrow
            .connect(restAccounts[3])
            .storeResults(MOCK_URL, MOCK_HASH, 50)
        ).wait();

        expect((result?.logs[0] as EventLog).args).to.contain(MOCK_URL);
        expect((result?.logs[0] as EventLog).args).to.contain(MOCK_HASH);
      });
    });
  });

  describe('storeResults', async () => {
    describe('Validations', function () {
      beforeEach(async () => {
        await deployEscrow();
      });
      it('Should revert with the right error if address calling not trusted', async function () {
        await expect(
          escrow.connect(externalAddress).storeResults(MOCK_URL, MOCK_HASH, 50)
        ).to.be.revertedWith('Address calling not trusted');
      });

      it('Should revert with the right error if address calling is reputation oracle', async function () {
        await expect(
          escrow.connect(reputationOracle).storeResults(MOCK_URL, MOCK_HASH, 50)
        ).to.be.revertedWith('Address calling not trusted');
      });

      it('Should revert with the right error if escrow not in Pending, Partial or ToCancel status state', async function () {
        await escrow
          .connect(owner)
          .addTrustedHandlers([await reputationOracle.getAddress()]);
        await expect(
          escrow.connect(reputationOracle).storeResults(MOCK_URL, MOCK_HASH, 50)
        ).to.be.revertedWith(
          'Escrow not in Pending, Partial or ToCancel status state'
        );
      });

      it('Should revert with the right error if amount sent is 0', async function () {
        await fundEscrow();
        await setupEscrow();
        await escrow
          .connect(owner)
          .addTrustedHandlers([await reputationOracle.getAddress()]);
        await expect(
          escrow.connect(reputationOracle).storeResults(MOCK_URL, MOCK_HASH, 0)
        ).to.be.revertedWith('Amount must be greater than zero');
      });

      it('Should revert with the right error if amount is higher than unreserved funds', async function () {
        await fundEscrow();
        await setupEscrow();

        await escrow
          .connect(owner)
          .addTrustedHandlers([await reputationOracle.getAddress()]);
        await expect(
          escrow
            .connect(reputationOracle)
            .storeResults(MOCK_URL, MOCK_HASH, 150)
        ).to.be.revertedWith('Not enough unreserved funds');
      });
    });

    describe('Events', function () {
      before(async () => {
        await deployEscrow();
        await fundEscrow();
        await setupEscrow();
      });

      it('Should emit an event on intermediate storage', async function () {
        await expect(
          await escrow.connect(owner).storeResults(MOCK_URL, MOCK_HASH, 50)
        )
          .to.emit(escrow, 'IntermediateStorage')
          .withArgs(MOCK_URL, MOCK_HASH);
      });
    });

    describe('Store results', async function () {
      beforeEach(async () => {
        await deployEscrow();
        await fundEscrow();
        await setupEscrow();
      });

      it('Should succeed when recording oracle stores results', async () => {
        const initialOwnerBalance = await token
          .connect(owner)
          .balanceOf(launcher.getAddress());
        const result = await (
          await escrow
            .connect(recordingOracle)
            .storeResults(MOCK_URL, MOCK_HASH, 50)
        ).wait();

        const finalOwnerBalance = await token
          .connect(owner)
          .balanceOf(launcher.getAddress());
        expect((result?.logs[0] as EventLog).args).to.contain(MOCK_URL);
        expect((result?.logs[0] as EventLog).args).to.contain(MOCK_HASH);
        expect(finalOwnerBalance - initialOwnerBalance).to.equal(0);
        expect(await escrow.remainingFunds()).to.equal(100);
        expect(await escrow.reservedFunds()).to.equal(50);
      });

      it('Should succeed when a trusted handler stores results', async () => {
        const initialOwnerBalance = await token
          .connect(owner)
          .balanceOf(launcher.getAddress());
        const result = await (
          await escrow
            .connect(trustedHandlers[0])
            .storeResults(MOCK_URL, MOCK_HASH, 50)
        ).wait();

        const finalOwnerBalance = await token
          .connect(owner)
          .balanceOf(launcher.getAddress());
        expect((result?.logs[0] as EventLog).args).to.contain(MOCK_URL);
        expect((result?.logs[0] as EventLog).args).to.contain(MOCK_HASH);
        expect(finalOwnerBalance - initialOwnerBalance).to.equal(0);
        expect(await escrow.remainingFunds()).to.equal(100);
        expect(await escrow.reservedFunds()).to.equal(50);
      });

      it('Should return unreserved funds to escrow launcher when status is ToCancel', async () => {
        const initialOwnerBalance = await token
          .connect(owner)
          .balanceOf(launcher.getAddress());
        await (await escrow.connect(launcher).cancel()).wait();
        const result = await (
          await escrow
            .connect(recordingOracle)
            .storeResults(MOCK_URL, MOCK_HASH, 50)
        ).wait();

        expect((result?.logs[0] as EventLog).args).to.contain(MOCK_URL);
        expect((result?.logs[0] as EventLog).args).to.contain(MOCK_HASH);
        const finalOwnerBalance = await token
          .connect(owner)
          .balanceOf(launcher.getAddress());
        expect(finalOwnerBalance - initialOwnerBalance).to.equal(50);
        expect(await escrow.remainingFunds()).to.equal(50);
        expect(await escrow.reservedFunds()).to.equal(50);
      });
    });
  });

  describe('setup', () => {
    describe('Validations', function () {
      before(async () => {
        await deployEscrow();
      });

      it('Should revert with the right error if address calling not trusted', async function () {
        await expect(
          escrow
            .connect(externalAddress)
            .setup(
              await reputationOracle.getAddress(),
              await recordingOracle.getAddress(),
              await exchangeOracle.getAddress(),
              10,
              10,
              10,
              MOCK_URL,
              MOCK_HASH
            )
        ).to.be.revertedWith('Address calling not trusted');
      });

      it('Should revert with the right error if set invalid or missing reputation oracle address', async function () {
        await expect(
          escrow
            .connect(owner)
            .setup(
              ethers.ZeroAddress,
              await recordingOracle.getAddress(),
              await exchangeOracle.getAddress(),
              10,
              10,
              10,
              MOCK_URL,
              MOCK_HASH
            )
        ).to.be.revertedWith('Invalid reputation oracle address');
      });

      it('Should revert with the right error if set invalid or missing recording oracle address', async function () {
        await expect(
          escrow
            .connect(owner)
            .setup(
              await reputationOracle.getAddress(),
              ethers.ZeroAddress,
              await exchangeOracle.getAddress(),
              10,
              10,
              10,
              MOCK_URL,
              MOCK_HASH
            )
        ).to.be.revertedWith('Invalid recording oracle address');
      });

      it('Should revert with the right error if set invalid or missing exchange oracle address', async function () {
        await expect(
          escrow
            .connect(owner)
            .setup(
              await reputationOracle.getAddress(),
              await reputationOracle.getAddress(),
              ethers.ZeroAddress,
              10,
              10,
              10,
              MOCK_URL,
              MOCK_HASH
            )
        ).to.be.revertedWith('Invalid exchange oracle address');
      });

      it('Should revert with the right error if fee percentage out of bounds and too high', async function () {
        await expect(
          escrow
            .connect(owner)
            .setup(
              await reputationOracle.getAddress(),
              await recordingOracle.getAddress(),
              await exchangeOracle.getAddress(),
              40,
              40,
              40,
              MOCK_URL,
              MOCK_HASH
            )
        ).to.be.revertedWith('Percentage out of bounds');
      });
    });

    describe('Events', function () {
      before(async () => {
        await deployEscrow();
        await fundEscrow();
      });

      it('Should emit an event on pending', async function () {
        await expect(
          escrow
            .connect(owner)
            .setup(
              await reputationOracle.getAddress(),
              await recordingOracle.getAddress(),
              await exchangeOracle.getAddress(),
              10,
              10,
              10,
              MOCK_URL,
              MOCK_HASH
            )
        )
          .to.emit(escrow, 'PendingV2')
          .withArgs(
            MOCK_URL,
            MOCK_HASH,
            await reputationOracle.getAddress(),
            await recordingOracle.getAddress(),
            await exchangeOracle.getAddress()
          )
          .to.emit(escrow, 'Fund')
          .withArgs(100);
      });
    });

    describe('Setup escrow', async function () {
      beforeEach(async () => {
        await deployEscrow();
        await fundEscrow();
      });

      it('Should set correct escrow with params', async () => {
        await escrow
          .connect(owner)
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

        expect(await escrow.reputationOracle()).to.equal(
          await reputationOracle.getAddress()
        );
        expect(await escrow.recordingOracle()).to.equal(
          await recordingOracle.getAddress()
        );
        expect(await escrow.exchangeOracle()).to.equal(
          await exchangeOracle.getAddress()
        );
        expect(await escrow.manifestUrl()).to.equal(MOCK_URL);
        expect(await escrow.manifestHash()).to.equal(MOCK_HASH);
        expect(await escrow.status()).to.equal(Status.Pending);
      });

      it('Should set correct escrow with params by trusted handler', async () => {
        await escrow
          .connect(trustedHandlers[0])
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

        expect(await escrow.reputationOracle()).to.equal(
          await reputationOracle.getAddress()
        );
        expect(await escrow.recordingOracle()).to.equal(
          await recordingOracle.getAddress()
        );
        expect(await escrow.exchangeOracle()).to.equal(
          await exchangeOracle.getAddress()
        );
        expect(await escrow.manifestUrl()).to.equal(MOCK_URL);
        expect(await escrow.manifestHash()).to.equal(MOCK_HASH);
        expect(await escrow.status()).to.equal(Status.Pending);
      });
    });
  });

  describe('cancel', () => {
    describe('Validations', function () {
      before(async () => {
        await deployEscrow();
        await fundEscrow();
        await setupEscrow();
        await storeResults(100);

        await escrow
          .connect(owner)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256)'
          ]([await restAccounts[0].getAddress()], [100], MOCK_URL, MOCK_HASH, '000');
      });

      it('Should revert with the right error if address calling not trusted', async function () {
        await expect(
          escrow.connect(externalAddress).cancel()
        ).to.be.revertedWith('Address calling not trusted');
      });

      it('Should revert with the right error if address calling is reputation oracle', async function () {
        await expect(
          escrow.connect(reputationOracle).cancel()
        ).to.be.revertedWith('Address calling not trusted');
      });

      it('Should revert with the right error if address calling is recording oracle', async function () {
        await expect(
          escrow.connect(recordingOracle).cancel()
        ).to.be.revertedWith('Address calling not trusted');
      });
    });

    describe('Cancel escrow', async function () {
      beforeEach(async () => {
        await deployEscrow();
        await fundEscrow();
        await setupEscrow();
      });

      it('Should succeed when the contract was canceled', async () => {
        await escrow.connect(owner).cancel();
        const status = await escrow.status();
        expect(status).to.equal(Status.ToCancel);
      });

      it('Should succeed when the contract was canceled by trusted handler', async () => {
        await escrow.connect(trustedHandlers[0]).cancel();
        const status = await escrow.status();
        expect(status).to.equal(Status.ToCancel);
      });

      it('Should succeed when the contract was canceled', async () => {
        await escrow.connect(owner).cancel();
        const status = await escrow.status();
        expect(status).to.equal(Status.ToCancel);
      });

      it('Should succeed when the contract was canceled by trusted handler', async () => {
        await escrow.connect(trustedHandlers[0]).cancel();
        const status = await escrow.status();
        expect(status).to.equal(Status.ToCancel);
      });
    });
  });

  describe('bulkPayOut', () => {
    describe('Validations', function () {
      before(async () => {
        await deployEscrow();
        await fundEscrow();
        await setupEscrow();
        await storeResults();
      });

      it('Should revert with the right error if address calling is not trusted', async function () {
        const recepients = [await restAccounts[0].getAddress()];
        const amounts = [10];

        await expect(
          escrow
            .connect(externalAddress)
            [
              'bulkPayOut(address[],uint256[],string,string,uint256)'
            ](recepients, amounts, MOCK_URL, MOCK_HASH, '000')
        ).to.be.revertedWith('Address calling not trusted');
      });

      it('Should revert with the right error if address calling is recording oracle', async function () {
        const recepients = [await restAccounts[0].getAddress()];
        const amounts = [10];

        await expect(
          escrow
            .connect(recordingOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,uint256)'
            ](recepients, amounts, MOCK_URL, MOCK_HASH, '000')
        ).to.be.revertedWith('Address calling not trusted');
      });

      it('Should revert with the right error if amount of recipients more then amount of values', async function () {
        const recepients = [
          await restAccounts[0].getAddress(),
          await restAccounts[1].getAddress(),
          await restAccounts[2].getAddress(),
        ];
        const amounts = [10, 20];

        await expect(
          escrow
            .connect(reputationOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,uint256)'
            ](recepients, amounts, MOCK_URL, MOCK_HASH, '000')
        ).to.be.revertedWith("Amount of recipients and values don't match");
      });

      it('Should revert with the right error if amount of recipients less then amount of values', async function () {
        const recepients = [
          await restAccounts[0].getAddress(),
          await restAccounts[1].getAddress(),
        ];
        const amounts = [10, 20, 30];

        await expect(
          escrow
            .connect(reputationOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,uint256)'
            ](recepients, amounts, MOCK_URL, MOCK_HASH, '000')
        ).to.be.revertedWith("Amount of recipients and values don't match");
      });

      it('Should revert with the right error if too many recipients', async function () {
        const recepients = Array.from(
          new Array(BULK_MAX_COUNT + 1),
          () => ethers.ZeroAddress
        );
        const amounts = Array.from({ length: BULK_MAX_COUNT + 1 }, () => 1);

        await expect(
          escrow
            .connect(reputationOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,uint256)'
            ](recepients, amounts, MOCK_URL, MOCK_HASH, '000')
        ).to.be.revertedWith('Too many recipients');
      });

      it('Should revert with the right error if trying to payout more than reservedFunds', async function () {
        const recepients = [
          await restAccounts[0].getAddress(),
          await restAccounts[1].getAddress(),
          await restAccounts[2].getAddress(),
        ];
        const amounts = [10, 20, 30];

        await expect(
          escrow
            .connect(reputationOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,uint256)'
            ](recepients, amounts, MOCK_URL, MOCK_HASH, '000')
        ).to.be.revertedWith('Not enough reserved funds');
      });
    });

    describe('Events', function () {
      beforeEach(async () => {
        await deployEscrow();
        await fundEscrow();
        await setupEscrow();
        await storeResults(100);
      });

      it('Should emit bulkPayOut and Completed events for complete bulkPayOut', async function () {
        const recepients = [await restAccounts[0].getAddress()];
        const amounts = [100];

        const tx = await escrow
          .connect(owner)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256)'
          ](recepients, amounts, MOCK_URL, MOCK_HASH, '000');

        await expect(tx)
          .to.emit(escrow, 'BulkTransferV2')
          .withArgs(anyValue, recepients, [100], false, MOCK_URL);

        await expect(tx).to.emit(escrow, 'Completed');
      });

      it('Should emit bulkPayOut and Cancelled events for complete bulkPayOut with ToCancel status', async function () {
        const recepients = [await restAccounts[0].getAddress()];
        const amounts = [100];

        await escrow.connect(owner).cancel();

        const tx = await escrow
          .connect(owner)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256)'
          ](recepients, amounts, MOCK_URL, MOCK_HASH, '000');

        await expect(tx)
          .to.emit(escrow, 'BulkTransferV2')
          .withArgs(anyValue, recepients, [100], false, MOCK_URL);

        await expect(tx).to.emit(escrow, 'Cancelled');
      });

      it('Should emit only bulkPayOut event for partial bulkPayOut', async function () {
        const recepients = [await restAccounts[0].getAddress()];
        const amounts = [10];

        const tx = await escrow
          .connect(owner)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256)'
          ](recepients, amounts, MOCK_URL, MOCK_HASH, '000');

        await expect(tx)
          .to.emit(escrow, 'BulkTransferV2')
          .withArgs(anyValue, recepients, [10], true, MOCK_URL);

        await expect(tx).not.to.emit(escrow, 'Completed');
      });

      it('Should emit bulkPayOut and Completed events for partial bulkPayOut with forceComplete option', async function () {
        const recepients = [await restAccounts[0].getAddress()];
        const amounts = [10];

        const tx = await escrow
          .connect(owner)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256,bool)'
          ](recepients, amounts, MOCK_URL, MOCK_HASH, '000', true);

        await expect(tx)
          .to.emit(escrow, 'BulkTransferV2')
          .withArgs(anyValue, recepients, [10], false, MOCK_URL);

        await expect(tx).to.emit(escrow, 'Completed');
      });

      it('Should emit bulkPayOut and Cancelled events for partial bulkPayOut with forceComplete option and ToCancel status', async function () {
        const recepients = [await restAccounts[0].getAddress()];
        const amounts = [10];

        await escrow.connect(owner).cancel();

        const tx = await escrow
          .connect(owner)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256,bool)'
          ](recepients, amounts, MOCK_URL, MOCK_HASH, '000', true);

        await expect(tx)
          .to.emit(escrow, 'BulkTransferV2')
          .withArgs(anyValue, recepients, [10], false, MOCK_URL);

        await expect(tx).to.emit(escrow, 'Cancelled');
      });
    });

    describe('Bulk payout for recipients', async function () {
      beforeEach(async () => {
        await deployEscrow();
        await fundEscrow();
        await setupEscrow();
        await storeResults(100);
      });

      it('Should pays each recipient their corresponding amount', async () => {
        const account1 = await restAccounts[0].getAddress();
        const account2 = await restAccounts[1].getAddress();
        const account3 = await restAccounts[2].getAddress();

        const initialBalanceAccount1 = await token
          .connect(owner)
          .balanceOf(account1);
        const initialBalanceAccount2 = await token
          .connect(owner)
          .balanceOf(account2);
        const initialBalanceAccount3 = await token
          .connect(owner)
          .balanceOf(account3);
        const initialBalanceRecordingOracle = await token
          .connect(owner)
          .balanceOf(await recordingOracle.getAddress());
        const initialBalanceReputationOracle = await token
          .connect(owner)
          .balanceOf(await reputationOracle.getAddress());
        const initialBalanceExchangeOracle = await token
          .connect(owner)
          .balanceOf(await exchangeOracle.getAddress());

        const recepients = [account1, account2, account3];
        const amounts = [10, 20, 30];

        await escrow
          .connect(reputationOracle)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256)'
          ](recepients, amounts, MOCK_URL, MOCK_HASH, '000');

        const finalBalanceAccount1 = await token
          .connect(owner)
          .balanceOf(account1);
        const finalBalanceAccount2 = await token
          .connect(owner)
          .balanceOf(account2);
        const finalBalanceAccount3 = await token
          .connect(owner)
          .balanceOf(account3);
        const finalBalanceRecordingOracle = await token
          .connect(owner)
          .balanceOf(await recordingOracle.getAddress());
        const finalBalanceReputationOracle = await token
          .connect(owner)
          .balanceOf(await reputationOracle.getAddress());
        const finalBalanceExchangeOracle = await token
          .connect(owner)
          .balanceOf(await exchangeOracle.getAddress());

        expect(
          (finalBalanceAccount1 - initialBalanceAccount1).toString()
        ).to.equal('7');
        expect(
          (finalBalanceAccount2 - initialBalanceAccount2).toString()
        ).to.equal('14');
        expect(
          (finalBalanceAccount3 - initialBalanceAccount3).toString()
        ).to.equal('21');
        expect(
          (
            finalBalanceRecordingOracle - initialBalanceRecordingOracle
          ).toString()
        ).to.equal('6');
        expect(
          (
            finalBalanceReputationOracle - initialBalanceReputationOracle
          ).toString()
        ).to.equal('6');

        expect(
          (finalBalanceExchangeOracle - initialBalanceExchangeOracle).toString()
        ).to.equal('6');

        expect(await escrow.remainingFunds()).to.equal('40');
      });

      it('Should pays each recipient their corresponding amount and return the remaining to launcher with force option', async () => {
        const account1 = await restAccounts[0].getAddress();
        const account2 = await restAccounts[1].getAddress();
        const account3 = await restAccounts[2].getAddress();

        const initialBalanceAccount1 = await token
          .connect(owner)
          .balanceOf(account1);
        const initialBalanceAccount2 = await token
          .connect(owner)
          .balanceOf(account2);
        const initialBalanceAccount3 = await token
          .connect(owner)
          .balanceOf(account3);
        const initialBalanceLauncher = await token
          .connect(owner)
          .balanceOf(await launcher.getAddress());
        const initialBalanceRecordingOracle = await token
          .connect(owner)
          .balanceOf(await recordingOracle.getAddress());
        const initialBalanceReputationOracle = await token
          .connect(owner)
          .balanceOf(await reputationOracle.getAddress());
        const initialBalanceExchangeOracle = await token
          .connect(owner)
          .balanceOf(await exchangeOracle.getAddress());

        const recepients = [account1, account2, account3];
        const amounts = [10, 20, 30];

        await escrow
          .connect(reputationOracle)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256,bool)'
          ](recepients, amounts, MOCK_URL, MOCK_HASH, '000', true);

        const finalBalanceAccount1 = await token
          .connect(owner)
          .balanceOf(account1);
        const finalBalanceAccount2 = await token
          .connect(owner)
          .balanceOf(account2);
        const finalBalanceAccount3 = await token
          .connect(owner)
          .balanceOf(account3);
        const finalBalanceLauncher = await token
          .connect(owner)
          .balanceOf(await launcher.getAddress());
        const finalBalanceRecordingOracle = await token
          .connect(owner)
          .balanceOf(await recordingOracle.getAddress());
        const finalBalanceReputationOracle = await token
          .connect(owner)
          .balanceOf(await reputationOracle.getAddress());
        const finalBalanceExchangeOracle = await token
          .connect(owner)
          .balanceOf(await exchangeOracle.getAddress());

        expect(
          (finalBalanceAccount1 - initialBalanceAccount1).toString()
        ).to.equal('7');
        expect(
          (finalBalanceAccount2 - initialBalanceAccount2).toString()
        ).to.equal('14');
        expect(
          (finalBalanceAccount3 - initialBalanceAccount3).toString()
        ).to.equal('21');
        expect(
          (finalBalanceLauncher - initialBalanceLauncher).toString()
        ).to.equal('40');
        expect(
          (
            finalBalanceRecordingOracle - initialBalanceRecordingOracle
          ).toString()
        ).to.equal('6');
        expect(
          (
            finalBalanceReputationOracle - initialBalanceReputationOracle
          ).toString()
        ).to.equal('6');

        expect(
          (finalBalanceExchangeOracle - initialBalanceExchangeOracle).toString()
        ).to.equal('6');

        expect(await escrow.remainingFunds()).to.equal('0');
      });

      it('Should runs from setup to bulkPayOut to complete correctly', async () => {
        const recepients = [await restAccounts[3].getAddress()];
        const amounts = [100];

        expect(await escrow.status()).to.equal(Status.Pending);

        await escrow
          .connect(reputationOracle)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256)'
          ](recepients, amounts, MOCK_URL, MOCK_HASH, '000');
        expect(await escrow.status()).to.equal(Status.Complete);
      });

      it('Should runs from setup to bulkPayOut to complete correctly with multiple addresses', async () => {
        const recepients = [
          await restAccounts[3].getAddress(),
          await restAccounts[4].getAddress(),
          await restAccounts[5].getAddress(),
        ];
        const amounts = [10, 20, 70];

        expect(await escrow.status()).to.equal(Status.Pending);

        await escrow
          .connect(reputationOracle)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256)'
          ](recepients, amounts, MOCK_URL, MOCK_HASH, '000');
        expect(await escrow.status()).to.equal(Status.Complete);
      });

      it('Should runs from setup to bulkPayOut to Cancelled correctly with multiple addresses', async () => {
        const recepients = [
          await restAccounts[3].getAddress(),
          await restAccounts[4].getAddress(),
          await restAccounts[5].getAddress(),
        ];
        const amounts = [10, 20, 70];

        await escrow.connect(owner).cancel();

        expect(await escrow.status()).to.equal(Status.ToCancel);

        await escrow
          .connect(reputationOracle)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256)'
          ](recepients, amounts, MOCK_URL, MOCK_HASH, '000');
        expect(await escrow.status()).to.equal(Status.Cancelled);
      });

      it('Should runs from setup to bulkPayOut to partial correctly', async () => {
        const recepients = [await restAccounts[3].getAddress()];
        const amounts = [80];

        expect(await escrow.status()).to.equal(Status.Pending);

        await escrow
          .connect(reputationOracle)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256)'
          ](recepients, amounts, MOCK_URL, MOCK_HASH, '000');
        expect(await escrow.status()).to.equal(Status.Partial);
      });

      it('Should runs partial bulkPayOut without modifying status if status is ToCancel', async () => {
        const recepients = [await restAccounts[3].getAddress()];
        const amounts = [80];

        await escrow.connect(owner).cancel();

        expect(await escrow.status()).to.equal(Status.ToCancel);

        await escrow
          .connect(reputationOracle)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256)'
          ](recepients, amounts, MOCK_URL, MOCK_HASH, '000');
        expect(await escrow.status()).to.equal(Status.ToCancel);
      });

      it('Should runs from setup to bulkPayOut to partial correctly with multiple addresses', async () => {
        const recepients = [
          await restAccounts[3].getAddress(),
          await restAccounts[4].getAddress(),
          await restAccounts[5].getAddress(),
        ];
        const amounts = [10, 20, 50];

        expect(await escrow.status()).to.equal(Status.Pending);

        await escrow
          .connect(reputationOracle)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256)'
          ](recepients, amounts, MOCK_URL, MOCK_HASH, '000');
        expect(await escrow.status()).to.equal(Status.Partial);
      });
    });
  });

  describe('complete', () => {
    describe('Validations', function () {
      beforeEach(async () => {
        await deployEscrow();
        await fundEscrow();
        await setupEscrow();
        await storeResults();
      });

      it('Should revert with the right error if escrow not in Paid, Partial or ToCancel state', async function () {
        await expect(escrow.connect(owner).complete()).to.be.revertedWith(
          'Escrow not in Paid or Partial state'
        );
      });
    });

    describe('Events', function () {
      beforeEach(async () => {
        await deployEscrow();
        await fundEscrow();
        await setupEscrow();
        await storeResults();
      });

      it('Should emit a Completed event when escrow is completed', async function () {
        const recipients = [await restAccounts[0].getAddress()];
        const amounts = [10];

        await escrow
          .connect(owner)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256,bool)'
          ](recipients, amounts, MOCK_URL, MOCK_HASH, '000', false);

        await expect(escrow.connect(owner).complete()).to.emit(
          escrow,
          'Completed'
        );
      });
    });

    describe('Complete escrow', async function () {
      beforeEach(async () => {
        await deployEscrow();
        await fundEscrow();
        await setupEscrow();
        await storeResults();
      });

      it('Should succeed if escrow is in Partial state', async function () {
        const recipients = [await restAccounts[0].getAddress()];
        const amounts = [10];
        await escrow
          .connect(owner)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256,bool)'
          ](recipients, amounts, MOCK_URL, MOCK_HASH, '000', false);
        expect(await escrow.status()).to.equal(Status.Partial);

        await escrow.connect(owner).complete();
        expect(await escrow.status()).to.equal(Status.Complete);
        expect(await escrow.remainingFunds()).to.equal('0');
      });

      it('Should transfer remaining funds to launcher on complete', async function () {
        const initialLauncherBalance = await token
          .connect(owner)
          .balanceOf(await launcher.getAddress());

        const recipients = [await restAccounts[0].getAddress()];
        const amounts = [10];
        await escrow
          .connect(owner)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256,bool)'
          ](recipients, amounts, MOCK_URL, MOCK_HASH, '000', false);
        await escrow.connect(owner).complete();

        const finalLauncherBalance = await token
          .connect(owner)
          .balanceOf(await launcher.getAddress());

        expect(finalLauncherBalance - initialLauncherBalance).to.equal('90');
      });
    });
  });
});
