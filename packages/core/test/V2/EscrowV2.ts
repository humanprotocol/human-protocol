/* eslint-disable @typescript-eslint/no-explicit-any */
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { EventLog, Signer } from 'ethers';
import { EscrowV2, HMToken } from '../../typechain-types';
import { faker } from '@faker-js/faker';

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
let escrow: EscrowV2;
let tokenAddress: string;

async function deployEscrow() {
  const Escrow = await ethers.getContractFactory(
    'contracts/V2/EscrowV2.sol:EscrowV2'
  );
  escrow = (await Escrow.deploy(
    tokenAddress,
    launcherAddress,
    adminAddress,
    STANDARD_DURATION
  )) as EscrowV2;
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

async function storeResults(
  amount: bigint,
  url: string = MOCK_URL,
  hash: string = MOCK_HASH
) {
  await escrow.connect(recordingOracle).storeResults(url, hash, amount);
}

describe('EscrowV2', function () {
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
    beforeEach(async () => {
      await deployEscrow();
    });

    it('sets token', async () => {
      expect(await escrow.token()).to.equal(tokenAddress);
    });

    it('initial status is Launched', async () => {
      expect(await escrow.status()).to.equal(Status.Launched);
    });

    it('launcher set correctly', async () => {
      expect(await escrow.launcher()).to.equal(launcherAddress);
    });

    it('admin set correctly', async () => {
      expect(await escrow.admin()).to.equal(adminAddress);
    });

    it('escrowFactory is deployer', async () => {
      expect(await escrow.escrowFactory()).to.equal(ownerAddress);
    });
  });

  describe('setup()', () => {
    beforeEach(async () => {
      await deployEscrow();
    });
    describe('reverts', () => {
      it('reverts when called by unauthorized address', async () => {
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

      it('reverts on zero reputation oracle', async () => {
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

      it('reverts on zero recording oracle', async () => {
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

      it('reverts on zero exchange oracle', async () => {
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

      it('reverts if total fee > 100', async () => {
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
      it('Launcher: emits Pending + Fund and sets state', async () => {
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
          .to.emit(escrow, 'Pending')
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

    it('Admin: emits Pending + Fund and sets state ', async () => {
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
        .to.emit(escrow, 'Pending')
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
  let fundAmt: bigint;
  beforeEach(async () => {
    await deployEscrow();
    fundAmt = await fundEscrow();
    await setupEscrow();
  });

  it('reverts outside Pending/Partial/ToCancel', async () => {
    await escrow.connect(launcher).cancel();
    await escrow.connect(recordingOracle).storeResults(MOCK_URL, MOCK_HASH, 0);
    expect(await escrow.status()).to.equal(Status.Cancelled);
    await expect(
      escrow.connect(recordingOracle).storeResults(MOCK_URL, MOCK_HASH, 0)
    ).to.be.revertedWith('Invalid status');
  });

  it('only recording oracle or admin allowed', async () => {
    await expect(
      escrow.connect(external).storeResults(MOCK_URL, MOCK_HASH, 0)
    ).to.be.revertedWith('Unauthorised');
    await expect(
      escrow.connect(launcher).storeResults(MOCK_URL, MOCK_HASH, 0)
    ).to.be.revertedWith('Unauthorised');
    await expect(
      escrow.connect(reputationOracle).storeResults(MOCK_URL, MOCK_HASH, 0)
    ).to.be.revertedWith('Unauthorised');
    await expect(
      escrow.connect(exchangeOracle).storeResults(MOCK_URL, MOCK_HASH, 0)
    ).to.be.revertedWith('Unauthorised');
  });

  it('reverts if reserving more than unreserved funds', async () => {
    await expect(
      escrow
        .connect(recordingOracle)
        .storeResults(MOCK_URL, MOCK_HASH, fundAmt + 1n)
    ).to.be.revertedWith('Insufficient unreserved funds');
  });

  it('allows zero reserve with empty url/hash', async () => {
    await expect(escrow.connect(recordingOracle).storeResults('', '', 0)).not
      .reverted;
  });

  it('requires url if reserve > 0', async () => {
    await expect(
      escrow.connect(recordingOracle).storeResults('', MOCK_HASH, 1)
    ).to.be.revertedWith('Empty URL');
  });

  it('requires hash if reserve > 0', async () => {
    await expect(
      escrow.connect(recordingOracle).storeResults(MOCK_URL, '', 1)
    ).to.be.revertedWith('Empty hash');
  });

  it('updates reservedFunds & emits IntermediateStorage', async () => {
    const reserve = fundAmt / 2n;
    await expect(
      escrow.connect(recordingOracle).storeResults(MOCK_URL, MOCK_HASH, reserve)
    )
      .to.emit(escrow, 'IntermediateStorage')
      .withArgs(MOCK_URL, MOCK_HASH);
    expect(await escrow.reservedFunds()).to.equal(reserve);
    expect(await escrow.remainingFunds()).to.equal(fundAmt);
  });

  //TODO:
  it('refunds unreserved + cancels if ToCancel & no remaining', async () => {
    await escrow.connect(launcher).cancel();
    const reserve = fundAmt / 2n;
    const initialBal = await token.balanceOf(launcherAddress);
    const tx = await escrow
      .connect(recordingOracle)
      .storeResults(MOCK_URL, MOCK_HASH, reserve);
    await expect(tx).to.emit(escrow, 'CancellationRefund');
    expect(await escrow.remainingFunds()).to.equal(reserve);
    expect(await escrow.status()).to.equal(Status.ToCancel);
    await escrow
      .connect(reputationOracle)
      .bulkPayOut(
        [await restAccounts[0].getAddress()],
        [reserve],
        MOCK_URL,
        MOCK_HASH,
        faker.string.uuid(),
        false
      );
    const finalBal = await token.balanceOf(launcherAddress);
    expect(finalBal - initialBal).to.be.gte(reserve);
  });
});

describe('cancel()', () => {
  beforeEach(async () => {
    await deployEscrow();
    await fundEscrow();
    await setupEscrow();
  });

  it('only admin or launcher', async () => {
    await expect(escrow.connect(external).cancel()).to.be.revertedWith(
      'Unauthorised'
    );
    await expect(escrow.connect(reputationOracle).cancel()).to.be.revertedWith(
      'Unauthorised'
    );
    await expect(escrow.connect(recordingOracle).cancel()).to.be.revertedWith(
      'Unauthorised'
    );
    await expect(escrow.connect(exchangeOracle).cancel()).to.be.revertedWith(
      'Unauthorised'
    );
  });

  it('marks status ToCancel & emits request', async () => {
    await expect(escrow.connect(launcher).cancel()).to.emit(
      escrow,
      'CancellationRequested'
    );
    expect(await escrow.status()).to.equal(Status.ToCancel);
  });
});

describe('bulkPayOut()', () => {
  let fundAmt: bigint;
  beforeEach(async () => {
    await deployEscrow();
    fundAmt = await fundEscrow();
    await setupEscrow();
  });

  it('reverts if no funds reserved', async () => {
    await expect(
      escrow
        .connect(reputationOracle)
        .bulkPayOut(
          [await restAccounts[0].getAddress()],
          [1],
          MOCK_URL,
          MOCK_HASH,
          faker.string.uuid(),
          false
        )
    ).to.be.revertedWith('Not enough reserved funds');
  });

  describe('with reserved funds', () => {
    beforeEach(async () => {
      await storeResults(fundAmt);
    });

    it('reverts when caller not admin or reputation oracle', async () => {
      await expect(
        escrow
          .connect(external)
          .bulkPayOut(
            [await restAccounts[0].getAddress()],
            [1],
            MOCK_URL,
            MOCK_HASH,
            faker.string.uuid(),
            false
          )
      ).to.be.revertedWith('Unauthorised');
      await expect(
        escrow
          .connect(recordingOracle)
          .bulkPayOut(
            [await restAccounts[0].getAddress()],
            [1],
            MOCK_URL,
            MOCK_HASH,
            faker.string.uuid(),
            false
          )
      ).to.be.revertedWith('Unauthorised');
      await expect(
        escrow
          .connect(launcher)
          .bulkPayOut(
            [await restAccounts[0].getAddress()],
            [1],
            MOCK_URL,
            MOCK_HASH,
            faker.string.uuid(),
            false
          )
      ).to.be.revertedWith('Unauthorised');
      await expect(
        escrow
          .connect(exchangeOracle)
          .bulkPayOut(
            [await restAccounts[0].getAddress()],
            [1],
            MOCK_URL,
            MOCK_HASH,
            faker.string.uuid(),
            false
          )
      ).to.be.revertedWith('Unauthorised');
    });

    it('reverts on length mismatch', async () => {
      await expect(
        escrow
          .connect(reputationOracle)
          .bulkPayOut(
            [
              await restAccounts[0].getAddress(),
              await restAccounts[1].getAddress(),
            ],
            [1],
            MOCK_URL,
            MOCK_HASH,
            faker.string.uuid(),
            false
          )
      ).to.be.revertedWith('Length mismatch');
    });

    it('reverts on too many recipients', async () => {
      const recipients = Array.from(
        { length: BULK_MAX_COUNT + 1 },
        () => ethers.ZeroAddress
      );
      const amounts = Array.from({ length: BULK_MAX_COUNT + 1 }, () => 1);
      await expect(
        escrow
          .connect(reputationOracle)
          .bulkPayOut(
            recipients,
            amounts,
            MOCK_URL,
            MOCK_HASH,
            faker.string.uuid(),
            false
          )
      ).to.be.revertedWith('Too many recipients');
    });

    it('reverts when payoutId reused', async () => {
      const id = faker.string.uuid();
      const r = [await restAccounts[0].getAddress()];
      const a = [1];
      await escrow
        .connect(reputationOracle)
        .bulkPayOut(r, a, MOCK_URL, MOCK_HASH, id, false);
      await expect(
        escrow
          .connect(reputationOracle)
          .bulkPayOut(r, a, MOCK_URL, MOCK_HASH, id, false)
      ).to.be.revertedWith('Payout id already exists');
    });

    it('partial payout leaves status Partial', async () => {
      const r = [await restAccounts[0].getAddress()];
      const a = [fundAmt / 2n];
      await escrow
        .connect(reputationOracle)
        .bulkPayOut(r, a, MOCK_URL, MOCK_HASH, faker.string.uuid(), false);
      expect(await escrow.status()).to.equal(Status.Partial);
    });

    it('full payout completes escrow', async () => {
      const r = [await restAccounts[0].getAddress()];
      const a = [fundAmt];
      const tx = await escrow
        .connect(reputationOracle)
        .bulkPayOut(r, a, MOCK_URL, MOCK_HASH, faker.string.uuid(), false);
      await expect(tx).to.emit(escrow, 'BulkTransfer');
      await expect(tx).to.emit(escrow, 'Completed');
      expect(await escrow.status()).to.equal(Status.Complete);
    });

    it('forceComplete finalizes even if funds remain', async () => {
      const r = [await restAccounts[0].getAddress()];
      const a = [fundAmt / 4n];
      const tx = await escrow
        .connect(reputationOracle)
        .bulkPayOut(r, a, MOCK_URL, MOCK_HASH, faker.string.uuid(), true);
      await expect(tx).to.emit(escrow, 'Completed');
      expect(await escrow.status()).to.equal(Status.Complete);
    });
  });

  describe('with ToCancel status', () => {
    beforeEach(async () => {
      await storeResults(fundAmt);
      await escrow.connect(launcher).cancel();
    });

    it('full payout triggers Cancelled', async () => {
      const r = [await restAccounts[0]];
      const a = [fundAmt];
      const tx = await escrow
        .connect(reputationOracle)
        .bulkPayOut(r, a, MOCK_URL, MOCK_HASH, faker.string.uuid(), false);
      await expect(tx).to.emit(escrow, 'Cancelled');
      expect(await escrow.status()).to.equal(Status.Cancelled);
    });

    it('partial payout keeps ToCancel unless forceComplete', async () => {
      const r = [await restAccounts[0].getAddress()];
      const a = [fundAmt / 2n];
      await escrow
        .connect(reputationOracle)
        .bulkPayOut(r, a, MOCK_URL, MOCK_HASH, faker.string.uuid(), false);
      expect(await escrow.status()).to.equal(Status.ToCancel);
    });

    it('partial + forceComplete -> Cancelled', async () => {
      const r = [await restAccounts[0].getAddress()];
      const a = [fundAmt / 2n];
      const tx = await escrow
        .connect(reputationOracle)
        .bulkPayOut(r, a, MOCK_URL, MOCK_HASH, faker.string.uuid(), true);
      await expect(tx).to.emit(escrow, 'Cancelled');
      expect(await escrow.status()).to.equal(Status.Cancelled);
    });
  });
});

describe('complete()', () => {
  let fundAmt: bigint;
  beforeEach(async () => {
    await deployEscrow();
    fundAmt = await fundEscrow();
    await setupEscrow();
    await storeResults(fundAmt / 2n);
  });

  it('reverts when status not Paid/Partial/ToCancel', async () => {
    await expect(
      escrow.connect(reputationOracle).complete()
    ).to.be.revertedWith('Invalid status');
  });

  it('completes from Partial', async () => {
    const r = [await restAccounts[0].getAddress()];
    const a = [fundAmt / 2n];
    await escrow
      .connect(reputationOracle)
      .bulkPayOut(r, a, MOCK_URL, MOCK_HASH, faker.string.uuid(), false);
    expect(await escrow.status()).to.equal(Status.Partial);
    await expect(escrow.connect(reputationOracle).complete()).to.emit(
      escrow,
      'Completed'
    );
    expect(await escrow.status()).to.equal(Status.Complete);
    expect(await escrow.remainingFunds()).to.equal(0n);
  });

  it('transfers remaining funds to launcher on complete', async () => {
    const r = [await restAccounts[0].getAddress()];
    const a = [fundAmt / 4n];
    const balBefore = await token.balanceOf(launcherAddress);
    await escrow
      .connect(reputationOracle)
      .bulkPayOut(r, a, MOCK_URL, MOCK_HASH, faker.string.uuid(), false);
    await escrow.connect(reputationOracle).complete();
    const balAfter = await token.balanceOf(launcherAddress);
    expect(balAfter - balBefore).to.equal(fundAmt - fundAmt / 4n);
  });
});

describe('withdraw()', () => {
  beforeEach(async () => {
    await deployEscrow();
    await fundEscrow();
    await setupEscrow();
  });

  it('only admin or launcher can withdraw', async () => {
    await expect(
      escrow.connect(external).withdraw(tokenAddress)
    ).to.be.revertedWith('Unauthorised');
    await expect(
      escrow.connect(exchangeOracle).withdraw(tokenAddress)
    ).to.be.revertedWith('Unauthorised');
    await expect(
      escrow.connect(recordingOracle).withdraw(tokenAddress)
    ).to.be.revertedWith('Unauthorised');
    await expect(
      escrow.connect(reputationOracle).withdraw(tokenAddress)
    ).to.be.revertedWith('Unauthorised');
  });

  it('withdraws excess tokens above remainingFunds', async () => {
    const extra = ethers.parseEther('10');
    await token.connect(owner).transfer(await escrow.getAddress(), extra);
    const balBefore = await token.balanceOf(launcherAddress);
    await expect(escrow.connect(launcher).withdraw(tokenAddress)).to.emit(
      escrow,
      'Withdraw'
    );
    const balAfter = await token.balanceOf(launcherAddress);
    expect(balAfter - balBefore).to.equal(extra);
  });
});

describe('getters', () => {
  beforeEach(async () => {
    await deployEscrow();
    await fundEscrow();
    await setupEscrow();
  });

  it('getBalance matches token.balanceOf', async () => {
    const bal = await escrow.getBalance();
    const raw = await token.balanceOf(await escrow.getAddress());
    expect(bal).to.equal(raw);
  });

  it('remainingFunds + reservedFunds <= balance', async () => {
    const bal = await escrow.getBalance();
    const rem = await escrow.remainingFunds();
    const res = await escrow.reservedFunds?.();
    if (res !== undefined) {
      expect(rem + (res as bigint)).to.be.lte(bal);
    }
  });
});
