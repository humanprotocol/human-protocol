import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Signer } from 'ethers';
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
}

let owner: Signer,
  launcher: Signer,
  reputationOracle: Signer,
  recordingOracle: Signer,
  externalAddress: Signer,
  restAccounts: Signer[],
  trustedHandlers: Signer[];

let token: HMToken, escrow: Escrow;

async function deployEscrow() {
  // Deploy Escrow Contract
  const Escrow = await ethers.getContractFactory('contracts/Escrow.sol:Escrow');
  escrow = (await Escrow.deploy(
    token.address,
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
      10,
      10,
      MOCK_URL,
      MOCK_HASH
    );
}

async function fundEscrow() {
  const amount = 100;
  await token.connect(owner).transfer(escrow.address, amount);
}

describe('Escrow', function () {
  this.beforeAll(async () => {
    [
      owner,
      launcher,
      reputationOracle,
      recordingOracle,
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
      expect(result).to.equal(token.address);
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
      await token.connect(owner).transfer(escrow.address, amount);

      const result = await escrow.connect(launcher).getBalance();
      expect(result).to.equal(amount.toString());
    });
  });

  describe('abort', () => {
    describe('Validations', function () {
      before(async () => {
        await deployEscrow();
        await setupEscrow();
      });

      it('Should revert when aborting with not trusted address', async function () {
        // const tx = await escrow.connect(externalAddress).abort()
        // console.log(`Abort costs: ${tx.receipt.gasUsed} wei.`);
        await expect(
          escrow.connect(externalAddress).abort()
        ).to.be.revertedWith('Address calling not trusted');
      });

      it('Should revert when aborting from reputation oracle', async function () {
        await expect(
          escrow.connect(reputationOracle).abort()
        ).to.be.revertedWith('Address calling not trusted');
      });

      it('Should revert when aborting from recording oracle', async function () {
        await expect(
          escrow.connect(recordingOracle).abort()
        ).to.be.revertedWith('Address calling not trusted');
      });
    });

    describe('Calling abort', function () {
      beforeEach(async () => {
        await deployEscrow();
        await setupEscrow();
      });

      it('Should transfer tokens to owner if contract funded when abort is called', async function () {
        const amount = 100;
        await token.connect(owner).transfer(escrow.address, amount);

        await escrow.connect(owner).abort();

        expect(
          (await token.connect(owner).balanceOf(escrow.address)).toString()
        ).to.equal('0', 'Escrow has not been properly aborted');
      });

      it('Should transfer tokens to owner if contract funded when abort is called from trusted handler', async function () {
        const amount = 100;
        await token.connect(owner).transfer(escrow.address, amount);

        await escrow.connect(trustedHandlers[0]).abort();

        expect(
          (await token.connect(owner).balanceOf(escrow.address)).toString()
        ).to.equal('0', 'Escrow has not been properly aborted');
      });
    });
  });

  describe('addTrustedHandlers', async () => {
    before(async () => {
      await deployEscrow();
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

      it('Should revert when aborting from reputation oracle', async function () {
        await expect(
          escrow
            .connect(reputationOracle)
            .addTrustedHandlers([await externalAddress.getAddress()])
        ).to.be.revertedWith('Address calling not trusted');
      });

      it('Should revert when aborting from recording oracle', async function () {
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
            .storeResults(MOCK_URL, MOCK_HASH)
        ).wait();

        expect(result.events?.[0].event).to.equal(
          'IntermediateStorage',
          'IntermediateStorage event was not emitted'
        );
      });

      it('Should succeed when add a new trusted handler from trusted handler and a trusted handler stores results', async () => {
        await escrow
          .connect(trustedHandlers[0])
          .addTrustedHandlers([await restAccounts[3].getAddress()]);

        const result = await (
          await escrow
            .connect(restAccounts[3])
            .storeResults(MOCK_URL, MOCK_HASH)
        ).wait();

        expect(result.events?.[0].event).to.equal(
          'IntermediateStorage',
          'IntermediateStorage event was not emitted'
        );
      });
    });
  });

  describe('storeResults', async () => {
    describe('Validations', function () {
      before(async () => {
        await deployEscrow();
      });
      it('Should revert with the right error if address calling not trusted', async function () {
        await expect(
          escrow.connect(externalAddress).storeResults(MOCK_URL, MOCK_HASH)
        ).to.be.revertedWith('Address calling not trusted');
      });

      it('Should revert with the right error if address calling is reputation oracle', async function () {
        await expect(
          escrow.connect(reputationOracle).storeResults(MOCK_URL, MOCK_HASH)
        ).to.be.revertedWith('Address calling not trusted');
      });

      it('Should revert with the right error if escrow not in Pending or Partial status state', async function () {
        await escrow
          .connect(owner)
          .addTrustedHandlers([await reputationOracle.getAddress()]);
        await expect(
          escrow.connect(reputationOracle).storeResults(MOCK_URL, MOCK_HASH)
        ).to.be.revertedWith('Escrow not in Pending or Partial status state');
      });
    });

    describe('Events', function () {
      before(async () => {
        await deployEscrow();
        await setupEscrow();
      });

      it('Should emit an event on intermediate storage', async function () {
        await expect(
          await escrow.connect(owner).storeResults(MOCK_URL, MOCK_HASH)
        )
          .to.emit(escrow, 'IntermediateStorage')
          .withArgs(MOCK_URL, MOCK_HASH);
      });
    });

    describe('Store results', async function () {
      before(async () => {
        await deployEscrow();
        await setupEscrow();
      });

      it('Should succeed when recording oracle stores results', async () => {
        const result = await (
          await escrow
            .connect(recordingOracle)
            .storeResults(MOCK_URL, MOCK_HASH)
        ).wait();

        expect(result.events?.[0].event).to.equal(
          'IntermediateStorage',
          'IntermediateStorage event was not emitted'
        );
      });

      it('Should succeed when a trusted handler stores results', async () => {
        const result = await (
          await escrow
            .connect(trustedHandlers[0])
            .storeResults(MOCK_URL, MOCK_HASH)
        ).wait();

        expect(result.events?.[0].event).to.equal(
          'IntermediateStorage',
          'IntermediateStorage event was not emitted'
        );
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
              10,
              10,
              MOCK_URL,
              MOCK_HASH
            )
        ).to.be.revertedWith('Address calling not trusted');
      });

      it('Should revert with the right error if set invalid or missing recording oracle address', async function () {
        await expect(
          escrow
            .connect(owner)
            .setup(
              ethers.constants.AddressZero,
              await recordingOracle.getAddress(),
              10,
              10,
              MOCK_URL,
              MOCK_HASH
            )
        ).to.be.revertedWith('Invalid or missing token spender');
      });

      it('Should revert with the right error if set invalid or missing reputation oracle address', async function () {
        await expect(
          escrow
            .connect(owner)
            .setup(
              await reputationOracle.getAddress(),
              ethers.constants.AddressZero,
              10,
              10,
              MOCK_URL,
              MOCK_HASH
            )
        ).to.be.revertedWith('Invalid or missing token spender');
      });

      it('Should revert with the right error if fee percentage out of bounds and too high', async function () {
        await expect(
          escrow
            .connect(owner)
            .setup(
              await reputationOracle.getAddress(),
              await recordingOracle.getAddress(),
              80,
              80,
              MOCK_URL,
              MOCK_HASH
            )
        ).to.be.revertedWith('Percentage out of bounds');
      });
    });

    describe('Events', function () {
      before(async () => {
        await deployEscrow();
      });

      it('Should emit an event on pending', async function () {
        await expect(
          escrow
            .connect(owner)
            .setup(
              await reputationOracle.getAddress(),
              await recordingOracle.getAddress(),
              10,
              10,
              MOCK_URL,
              MOCK_HASH
            )
        )
          .to.emit(escrow, 'Pending')
          .withArgs(MOCK_URL, MOCK_HASH);
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

        await escrow
          .connect(owner)
          .bulkPayOut(
            [await restAccounts[0].getAddress()],
            [100],
            MOCK_URL,
            MOCK_HASH,
            '000'
          );
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
        const ststus = await escrow.status();
        expect(ststus).to.equal(Status.Cancelled);

        expect(await token.connect(owner).balanceOf(escrow.address)).to.equal(
          '0',
          'Escrow has not been properly canceled'
        );
      });

      it('Should succeed when the contract was canceled by trusted handler', async () => {
        await escrow.connect(trustedHandlers[0]).cancel();
        const ststus = await escrow.status();
        expect(ststus).to.equal(Status.Cancelled);

        expect(await token.connect(owner).balanceOf(escrow.address)).to.equal(
          '0',
          'Escrow has not been properly canceled'
        );
      });
    });
  });

  describe('bulkPayOut', () => {
    describe('Validations', function () {
      before(async () => {
        await deployEscrow();
        await fundEscrow();
        await setupEscrow();
      });

      it('Should revert with the right error if address calling is not trusted', async function () {
        const recepients = [await restAccounts[0].getAddress()];
        const amounts = [10];

        await expect(
          escrow
            .connect(externalAddress)
            .bulkPayOut(recepients, amounts, MOCK_URL, MOCK_HASH, '000')
        ).to.be.revertedWith('Address calling not trusted');
      });

      it('Should revert with the right error if address calling is recording oracle', async function () {
        const recepients = [await restAccounts[0].getAddress()];
        const amounts = [10];

        await expect(
          escrow
            .connect(recordingOracle)
            .bulkPayOut(recepients, amounts, MOCK_URL, MOCK_HASH, '000')
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
            .bulkPayOut(recepients, amounts, MOCK_URL, MOCK_HASH, '000')
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
            .bulkPayOut(recepients, amounts, MOCK_URL, MOCK_HASH, '000')
        ).to.be.revertedWith("Amount of recipients and values don't match");
      });

      it('Should revert with the right error if too many recipients', async function () {
        const recepients = Array.from(
          new Array(BULK_MAX_COUNT + 1),
          () => ethers.constants.AddressZero
        );
        const amounts = Array.from({ length: BULK_MAX_COUNT + 1 }, () => 1);

        await expect(
          escrow
            .connect(reputationOracle)
            .bulkPayOut(recepients, amounts, MOCK_URL, MOCK_HASH, '000')
        ).to.be.revertedWith('Too many recipients');
      });
    });

    describe('Events', function () {
      before(async () => {
        await deployEscrow();
        await fundEscrow();
        await setupEscrow();
      });

      it('Should emit an event on bulk transfer', async function () {
        const recepients = [await restAccounts[0].getAddress()];
        const amounts = [10];

        await expect(
          escrow
            .connect(owner)
            .bulkPayOut(recepients, amounts, MOCK_URL, MOCK_HASH, '000')
        )
          .to.emit(escrow, 'BulkTransfer')
          .withArgs(anyValue, recepients, [8], true);
      });
    });

    describe('Bulk payout for recipients', async function () {
      beforeEach(async () => {
        await deployEscrow();
        await fundEscrow();
        await setupEscrow();
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

        const recepients = [account1, account2, account3];
        const amounts = [10, 20, 30];

        await escrow
          .connect(reputationOracle)
          .bulkPayOut(recepients, amounts, MOCK_URL, MOCK_HASH, '000');

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

        expect(
          (
            finalBalanceAccount1.toNumber() - initialBalanceAccount1.toNumber()
          ).toString()
        ).to.equal('8');
        expect(
          (
            finalBalanceAccount2.toNumber() - initialBalanceAccount2.toNumber()
          ).toString()
        ).to.equal('16');
        expect(
          (
            finalBalanceAccount3.toNumber() - initialBalanceAccount3.toNumber()
          ).toString()
        ).to.equal('24');
        expect(
          (
            finalBalanceRecordingOracle.toNumber() -
            initialBalanceRecordingOracle.toNumber()
          ).toString()
        ).to.equal('6');
        expect(
          (
            finalBalanceReputationOracle.toNumber() -
            initialBalanceReputationOracle.toNumber()
          ).toString()
        ).to.equal('6');

        expect(
          (
            finalBalanceReputationOracle.toNumber() -
            initialBalanceReputationOracle.toNumber()
          ).toString()
        ).to.equal('6');
      });

      it('Should runs from setup to bulkPayOut to complete correctly', async () => {
        const recepients = [await restAccounts[3].getAddress()];
        const amounts = [100];

        expect(await escrow.status()).to.equal(Status.Pending);

        await escrow
          .connect(reputationOracle)
          .bulkPayOut(recepients, amounts, MOCK_URL, MOCK_HASH, '000');
        expect(await escrow.status()).to.equal(Status.Paid);

        await escrow.connect(reputationOracle).complete();
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
          .bulkPayOut(recepients, amounts, MOCK_URL, MOCK_HASH, '000');
        expect(await escrow.status()).to.equal(Status.Paid);

        await escrow.connect(reputationOracle).complete();
        expect(await escrow.status()).to.equal(Status.Complete);
      });
    });
  });

  describe('complete', () => {
    describe('Validations', function () {
      before(async () => {
        await deployEscrow();
        await fundEscrow();
        await setupEscrow();
      });

      it('Should revert with the right error if address calling is not trusted', async function () {
        await expect(
          escrow.connect(externalAddress).complete()
        ).to.be.revertedWith('Address calling not trusted');
      });

      it('Should revert with the right error if address calling is recording oracle', async function () {
        await expect(
          escrow.connect(recordingOracle).complete()
        ).to.be.revertedWith('Address calling not trusted');
      });

      it('Should revert with the right error if escrow not in Paid status state', async function () {
        await expect(escrow.connect(owner).complete()).to.be.revertedWith(
          'Escrow not in Paid state'
        );
      });
    });

    describe('Complete escrow', async function () {
      beforeEach(async () => {
        await deployEscrow();
        await fundEscrow();
        await setupEscrow();

        await escrow
          .connect(owner)
          .bulkPayOut(
            [await restAccounts[0].getAddress()],
            [100],
            MOCK_URL,
            MOCK_HASH,
            '000'
          );
      });

      it('Should succeed when the launcher completes', async () => {
        await escrow.connect(owner).complete();
        expect(await escrow.status()).to.equal(Status.Complete);
      });

      it('Should succeed when the trusted handler completes', async () => {
        await escrow.connect(trustedHandlers[0]).complete();
        expect(await escrow.status()).to.equal(Status.Complete);
      });
    });
  });
});
