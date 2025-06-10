/* eslint-disable @typescript-eslint/no-explicit-any */
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { EventLog, Signer } from 'ethers';
import { Escrow, HMToken } from '../typechain-types';
import { faker } from '@faker-js/faker';

const MOCK_URL = faker.internet.url();
const MOCK_HASH = faker.string.alphanumeric(10);
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
      3,
      3,
      3,
      MOCK_URL,
      MOCK_HASH
    );
}

async function fundEscrow(): Promise<bigint> {
  const amount = ethers.parseEther(
    faker.number.int({ min: 50, max: 200 }).toString()
  );
  await token.connect(owner).transfer(escrow.getAddress(), amount);
  return amount;
}

async function storeResults(amount: bigint) {
  await escrow
    .connect(restAccounts[0])
    .storeResults(MOCK_URL, MOCK_HASH, amount);
}

describe('Escrow', function () {
  before(async () => {
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
      const amount = ethers.parseEther(
        faker.number.int({ min: 500, max: 2000 }).toString()
      );
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

      it('Should revert with the right error if amount is higher than unreserved funds', async function () {
        const fundAmount = await fundEscrow();
        await setupEscrow();

        await escrow
          .connect(owner)
          .addTrustedHandlers([await reputationOracle.getAddress()]);
        await expect(
          escrow
            .connect(reputationOracle)
            .storeResults(MOCK_URL, MOCK_HASH, fundAmount * 2n)
        ).to.be.revertedWith('Not enough unreserved funds');
      });

      it('Should succeed if url and hash are empty and amount is 0', async function () {
        await deployEscrow();
        await fundEscrow();
        await setupEscrow();

        await expect(escrow.connect(trustedHandlers[0]).storeResults('', '', 0))
          .not.to.be.reverted;
      });

      it('Should revert if url is empty and amount is not 0', async function () {
        await deployEscrow();
        await fundEscrow();
        await setupEscrow();

        await expect(
          escrow.connect(trustedHandlers[0]).storeResults('', MOCK_HASH, 1)
        ).to.be.revertedWith("URL can't be empty");
      });

      it('Should revert if hash is empty and amount is not 0', async function () {
        await deployEscrow();
        await fundEscrow();
        await setupEscrow();

        await expect(
          escrow.connect(trustedHandlers[0]).storeResults(MOCK_URL, '', 1)
        ).to.be.revertedWith("Hash can't be empty");
      });

      it('Should revert if both url and hash are empty and amount is not 0', async function () {
        await deployEscrow();
        await fundEscrow();
        await setupEscrow();

        await expect(
          escrow.connect(trustedHandlers[0]).storeResults('', '', 1)
        ).to.be.revertedWith("URL can't be empty");
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
      let fundAmount: bigint;
      beforeEach(async () => {
        await deployEscrow();
        fundAmount = await fundEscrow();
        await setupEscrow();
      });

      it('Should succeed when recording oracle stores results', async () => {
        const initialOwnerBalance = await token
          .connect(owner)
          .balanceOf(launcher.getAddress());

        const result = await (
          await escrow
            .connect(recordingOracle)
            .storeResults(MOCK_URL, MOCK_HASH, fundAmount / 2n)
        ).wait();

        const finalOwnerBalance = await token
          .connect(owner)
          .balanceOf(launcher.getAddress());
        expect((result?.logs[0] as EventLog).args).to.contain(MOCK_URL);
        expect((result?.logs[0] as EventLog).args).to.contain(MOCK_HASH);
        expect(finalOwnerBalance - initialOwnerBalance).to.equal(0);
        expect(await escrow.remainingFunds()).to.equal(fundAmount);
        expect(await escrow.reservedFunds()).to.equal(fundAmount / 2n);
      });

      it('Should succeed when a trusted handler stores results', async () => {
        const initialOwnerBalance = await token
          .connect(owner)
          .balanceOf(launcher.getAddress());
        const result = await (
          await escrow
            .connect(trustedHandlers[0])
            .storeResults(MOCK_URL, MOCK_HASH, fundAmount / 2n)
        ).wait();

        const finalOwnerBalance = await token
          .connect(owner)
          .balanceOf(launcher.getAddress());
        expect((result?.logs[0] as EventLog).args).to.contain(MOCK_URL);
        expect((result?.logs[0] as EventLog).args).to.contain(MOCK_HASH);
        expect(finalOwnerBalance - initialOwnerBalance).to.equal(0);
        expect(await escrow.remainingFunds()).to.equal(fundAmount);
        expect(await escrow.reservedFunds()).to.equal(fundAmount / 2n);
      });

      it('Should return unreserved funds to escrow launcher when status is ToCancel', async () => {
        const initialOwnerBalance = await token
          .connect(owner)
          .balanceOf(launcher.getAddress());
        await (await escrow.connect(launcher).cancel()).wait();
        const result = await (
          await escrow
            .connect(recordingOracle)
            .storeResults(MOCK_URL, MOCK_HASH, fundAmount / 2n)
        ).wait();

        expect((result?.logs[0] as EventLog).args).to.contain(MOCK_URL);
        expect((result?.logs[0] as EventLog).args).to.contain(MOCK_HASH);
        const finalOwnerBalance = await token
          .connect(owner)
          .balanceOf(launcher.getAddress());
        expect(finalOwnerBalance - initialOwnerBalance).to.equal(
          fundAmount / 2n
        );
        expect(await escrow.remainingFunds()).to.equal(fundAmount / 2n);
        expect(await escrow.reservedFunds()).to.equal(fundAmount / 2n);
      });

      it('Should cancel the escrow if status is ToCancel, fundsToReserve is 0 and unreservedFunds is 0', async () => {
        await deployEscrow();
        await fundEscrow();
        await setupEscrow();

        await escrow.connect(owner).cancel();
        expect(await escrow.status()).to.equal(Status.ToCancel);

        const tx = await escrow
          .connect(trustedHandlers[0])
          .storeResults(MOCK_URL, MOCK_HASH, 0);

        await expect(tx).to.emit(escrow, 'CancellationRefund');
        await expect(tx).to.emit(escrow, 'Cancelled');
        expect(await escrow.status()).to.equal(Status.Cancelled);
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
      let fundAmount: bigint;
      before(async () => {
        await deployEscrow();
        fundAmount = await fundEscrow();
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
          .withArgs(fundAmount);
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
        const fundAmount = await fundEscrow();
        await setupEscrow();
        await storeResults(fundAmount);

        await escrow
          .connect(owner)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256)'
          ]([await restAccounts[0].getAddress()], [fundAmount], MOCK_URL, MOCK_HASH, '000');
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
      let fundAmount: bigint;
      before(async () => {
        await deployEscrow();
        fundAmount = await fundEscrow();
        await setupEscrow();
        await storeResults(fundAmount);
      });

      it('Should revert with the right error if address calling is not trusted', async function () {
        const recipients = [await restAccounts[0].getAddress()];
        const amounts = [
          fundAmount / 4n, //1/4
        ];

        await expect(
          escrow
            .connect(externalAddress)
            [
              'bulkPayOut(address[],uint256[],string,string,uint256)'
            ](recipients, amounts, MOCK_URL, MOCK_HASH, '000')
        ).to.be.revertedWith('Address calling not trusted');
      });

      it('Should revert with the right error if address calling is recording oracle', async function () {
        const recipients = [await restAccounts[0].getAddress()];
        const amounts = [
          fundAmount / 4n, //1/4
        ];

        await expect(
          escrow
            .connect(recordingOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,uint256)'
            ](recipients, amounts, MOCK_URL, MOCK_HASH, '000')
        ).to.be.revertedWith('Address calling not trusted');
      });

      it('Should revert with the right error if amount of recipients more then amount of values', async function () {
        const recipients = [
          await restAccounts[0].getAddress(),
          await restAccounts[1].getAddress(),
          await restAccounts[2].getAddress(),
        ];
        const amounts = [
          fundAmount / 4n, //1/4
          fundAmount / 2n, //1/2
        ];

        await expect(
          escrow
            .connect(reputationOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,uint256)'
            ](recipients, amounts, MOCK_URL, MOCK_HASH, '000')
        ).to.be.revertedWith("Amount of recipients and values don't match");
      });

      it('Should revert with the right error if amount of recipients less then amount of values', async function () {
        const recipients = [
          await restAccounts[0].getAddress(),
          await restAccounts[1].getAddress(),
        ];
        const amounts = [
          fundAmount / 4n, //1/4
          fundAmount / 2n, //1/2
          fundAmount / 4n, //1/4
        ];

        await expect(
          escrow
            .connect(reputationOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,uint256)'
            ](recipients, amounts, MOCK_URL, MOCK_HASH, '000')
        ).to.be.revertedWith("Amount of recipients and values don't match");
      });

      it('Should revert with the right error if too many recipients', async function () {
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

      it('Should revert with the right error if trying to payout more than reservedFunds', async function () {
        const recipients = [
          await restAccounts[0].getAddress(),
          await restAccounts[1].getAddress(),
          await restAccounts[2].getAddress(),
        ];
        const amounts = [
          fundAmount / 4n, //1/4
          fundAmount / 2n, //1/2
          fundAmount / 2n, //1/2
        ];

        await expect(
          escrow
            .connect(reputationOracle)
            [
              'bulkPayOut(address[],uint256[],string,string,uint256)'
            ](recipients, amounts, MOCK_URL, MOCK_HASH, '000')
        ).to.be.revertedWith('Not enough reserved funds');
      });
    });

    describe('Events', function () {
      let fundAmount: bigint;
      beforeEach(async () => {
        await deployEscrow();
        fundAmount = await fundEscrow();
        await setupEscrow();
        await storeResults(fundAmount);
      });

      it('Should emit bulkPayOut and Completed events for complete bulkPayOut', async function () {
        const recipients = [await restAccounts[0].getAddress()];
        const amounts = [fundAmount];

        const tx = await escrow
          .connect(owner)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256)'
          ](recipients, amounts, MOCK_URL, MOCK_HASH, '000');

        await expect(tx)
          .to.emit(escrow, 'BulkTransferV2')
          .withArgs(anyValue, recipients, [fundAmount], false, MOCK_URL);

        await expect(tx).to.emit(escrow, 'Completed');
      });

      it('Should emit bulkPayOut and Cancelled events for complete bulkPayOut with ToCancel status', async function () {
        const recipients = [await restAccounts[0].getAddress()];
        const amounts = [fundAmount];

        await escrow.connect(owner).cancel();

        const tx = await escrow
          .connect(owner)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256)'
          ](recipients, amounts, MOCK_URL, MOCK_HASH, '000');

        await expect(tx)
          .to.emit(escrow, 'BulkTransferV2')
          .withArgs(anyValue, recipients, [fundAmount], false, MOCK_URL);

        await expect(tx).to.emit(escrow, 'Cancelled');
      });

      it('Should emit only bulkPayOut event for partial bulkPayOut', async function () {
        const recipients = [await restAccounts[0].getAddress()];
        const amounts = [
          fundAmount / 4n, //1/4
        ];

        const tx = await escrow
          .connect(owner)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256)'
          ](recipients, amounts, MOCK_URL, MOCK_HASH, '000');

        await expect(tx)
          .to.emit(escrow, 'BulkTransferV2')
          .withArgs(anyValue, recipients, [fundAmount / 4n], true, MOCK_URL);

        await expect(tx).not.to.emit(escrow, 'Completed');
      });

      it('Should emit bulkPayOut and Completed events for partial bulkPayOut with forceComplete option', async function () {
        const recipients = [await restAccounts[0].getAddress()];
        const amounts = [
          fundAmount / 4n, //1/4
        ];

        const tx = await escrow
          .connect(owner)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256,bool)'
          ](recipients, amounts, MOCK_URL, MOCK_HASH, '000', true);

        await expect(tx)
          .to.emit(escrow, 'BulkTransferV2')
          .withArgs(anyValue, recipients, [fundAmount / 4n], false, MOCK_URL);

        await expect(tx).to.emit(escrow, 'Completed');
      });

      it('Should emit bulkPayOut and Cancelled events for partial bulkPayOut with forceComplete option and ToCancel status', async function () {
        const recipients = [await restAccounts[0].getAddress()];
        const amounts = [
          fundAmount / 4n, //1/4
        ];

        await escrow.connect(owner).cancel();

        const tx = await escrow
          .connect(owner)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256,bool)'
          ](recipients, amounts, MOCK_URL, MOCK_HASH, '000', true);

        await expect(tx)
          .to.emit(escrow, 'BulkTransferV2')
          .withArgs(anyValue, recipients, [fundAmount / 4n], false, MOCK_URL);

        await expect(tx).to.emit(escrow, 'Cancelled');
      });
    });

    describe('Bulk payout for recipients', async function () {
      let fundAmount: bigint;
      beforeEach(async () => {
        await deployEscrow();
        fundAmount = await fundEscrow();
        await setupEscrow();
        await storeResults(fundAmount);
      });

      it('Should pay each recipient their corresponding amount', async () => {
        const recipients = await Promise.all(
          restAccounts.slice(0, 3).map(async (account) => account.getAddress())
        );

        const initialBalances = await Promise.all(
          recipients.map(async (account) =>
            token.connect(owner).balanceOf(account)
          )
        );

        const initialOracleBalances = await Promise.all(
          [recordingOracle, reputationOracle, exchangeOracle].map(
            async (oracle) =>
              token.connect(owner).balanceOf(await oracle.getAddress())
          )
        );

        const amounts = recipients.map(() =>
          ethers
            .parseEther(faker.number.int({ min: 1, max: 20 }).toString())
            .toString()
        );

        await escrow
          .connect(reputationOracle)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256)'
          ](recipients, amounts, faker.internet.url(), faker.string.alphanumeric(10), faker.string.numeric(3));

        const finalBalances = await Promise.all(
          recipients.map(async (account) =>
            token.connect(owner).balanceOf(account)
          )
        );

        const finalOracleBalances = await Promise.all(
          [recordingOracle, reputationOracle, exchangeOracle].map(
            async (oracle) =>
              token.connect(owner).balanceOf(await oracle.getAddress())
          )
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

      it('Should pay each recipient their corresponding amount and return the remaining to launcher with force complete option', async () => {
        const recipients = await Promise.all(
          restAccounts.slice(0, 3).map(async (account) => account.getAddress())
        );

        const initialBalances = await Promise.all(
          recipients.map(async (account) =>
            token.connect(owner).balanceOf(account)
          )
        );

        const initialOracleBalances = await Promise.all(
          [recordingOracle, reputationOracle, exchangeOracle].map(
            async (oracle) =>
              token.connect(owner).balanceOf(await oracle.getAddress())
          )
        );

        const amounts = recipients.map(() =>
          ethers
            .parseEther(faker.number.int({ min: 1, max: 20 }).toString())
            .toString()
        );

        await escrow
          .connect(reputationOracle)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256,bool)'
          ](recipients, amounts, faker.internet.url(), faker.string.alphanumeric(10), faker.string.numeric(3), true);

        const finalBalances = await Promise.all(
          recipients.map(async (account) =>
            token.connect(owner).balanceOf(account)
          )
        );

        const finalOracleBalances = await Promise.all(
          [recordingOracle, reputationOracle, exchangeOracle].map(
            async (oracle) =>
              token.connect(owner).balanceOf(await oracle.getAddress())
          )
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
        expect(await escrow.remainingFunds()).to.equal('0');
        expect(await escrow.remainingFunds()).to.equal(
          await escrow.getBalance()
        );

        expect(await escrow.status()).to.equal(Status.Complete);
      });

      it('Should be completed when amount of payouts is equal to the balance', async () => {
        const recipients = [
          await restAccounts[3].getAddress(),
          await restAccounts[4].getAddress(),
          await restAccounts[5].getAddress(),
        ];
        const amounts = [
          fundAmount / 4n, //1/4
          fundAmount / 2n, //1/2
          fundAmount / 4n, //1/4
        ];

        expect(await escrow.status()).to.equal(Status.Pending);

        await escrow
          .connect(reputationOracle)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256)'
          ](recipients, amounts, MOCK_URL, MOCK_HASH, '000');
        expect(await escrow.status()).to.equal(Status.Complete);
      });

      it('Should runs from setup to bulkPayOut to Cancelled correctly with multiple addresses', async () => {
        const recipients = [
          await restAccounts[3].getAddress(),
          await restAccounts[4].getAddress(),
          await restAccounts[5].getAddress(),
        ];
        const amounts = [
          fundAmount / 4n, //1/4
          fundAmount / 2n, //1/2
          fundAmount / 4n, //1/4
        ];

        await escrow.connect(owner).cancel();

        expect(await escrow.status()).to.equal(Status.ToCancel);

        await escrow
          .connect(reputationOracle)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256)'
          ](recipients, amounts, MOCK_URL, MOCK_HASH, '000');
        expect(await escrow.status()).to.equal(Status.Cancelled);
      });

      it('Should runs from setup to bulkPayOut to partial correctly', async () => {
        const recipients = [await restAccounts[3].getAddress()];
        const amounts = [
          fundAmount - fundAmount / 5n, //4/5
        ];

        expect(await escrow.status()).to.equal(Status.Pending);

        await escrow
          .connect(reputationOracle)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256)'
          ](recipients, amounts, MOCK_URL, MOCK_HASH, '000');
        expect(await escrow.status()).to.equal(Status.Partial);
      });

      it('Should runs partial bulkPayOut without modifying status if status is ToCancel', async () => {
        const recipients = [await restAccounts[3].getAddress()];
        const amounts = [
          fundAmount - fundAmount / 5n, //4/5
        ];

        await escrow.connect(owner).cancel();

        expect(await escrow.status()).to.equal(Status.ToCancel);

        await escrow
          .connect(reputationOracle)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256)'
          ](recipients, amounts, MOCK_URL, MOCK_HASH, '000');
        expect(await escrow.status()).to.equal(Status.ToCancel);
      });

      it('Should runs from setup to bulkPayOut to partial correctly with multiple addresses', async () => {
        const recipients = [
          await restAccounts[3].getAddress(),
          await restAccounts[4].getAddress(),
          await restAccounts[5].getAddress(),
        ];
        const amounts = [
          fundAmount / 4n, //1/4
          fundAmount / 2n, //1/2
          fundAmount / 4n, //1/4
        ];

        expect(await escrow.status()).to.equal(Status.Pending);

        await escrow
          .connect(reputationOracle)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256)'
          ](recipients, amounts, MOCK_URL, MOCK_HASH, '000');
        expect(await escrow.status()).to.equal(Status.Complete);
      });
    });
  });

  describe('complete', () => {
    describe('Validations', function () {
      beforeEach(async () => {
        await deployEscrow();
        const fundAmount = await fundEscrow();
        await setupEscrow();
        await storeResults(fundAmount);
      });

      it('Should revert with the right error if escrow not in Paid, Partial or ToCancel state', async function () {
        await expect(escrow.connect(owner).complete()).to.be.revertedWith(
          'Escrow not in Paid or Partial state'
        );
      });
    });

    describe('Events', function () {
      let fundAmount: bigint;
      beforeEach(async () => {
        await deployEscrow();
        fundAmount = await fundEscrow();
        await setupEscrow();
        await storeResults(fundAmount / 4n);
      });

      it('Should emit a Completed event when escrow is completed', async function () {
        const recipients = [await restAccounts[0].getAddress()];
        const amounts = [
          fundAmount / 4n, //1/4
        ];

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
      let fundAmount: bigint;
      beforeEach(async () => {
        await deployEscrow();
        fundAmount = await fundEscrow();
        await setupEscrow();
        await storeResults(fundAmount / 2n);
      });

      it('Should succeed if escrow is in Partial state', async function () {
        const recipients = [await restAccounts[0].getAddress()];
        const amounts = [
          fundAmount / 4n, //1/4
        ];
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
        const amounts = [fundAmount / 2n];
        await escrow
          .connect(owner)
          [
            'bulkPayOut(address[],uint256[],string,string,uint256,bool)'
          ](recipients, amounts, MOCK_URL, MOCK_HASH, '000', false);
        await escrow.connect(owner).complete();

        const finalLauncherBalance = await token
          .connect(owner)
          .balanceOf(await launcher.getAddress());

        expect(finalLauncherBalance - initialLauncherBalance).to.equal(
          fundAmount - amounts[0]
        );
      });
    });
  });
});
