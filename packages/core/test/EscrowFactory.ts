import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import { EscrowFactory, HMToken } from '../typechain-types';

describe('EscrowFactory', function () {
  let owner: Signer,
    reputationOracle: Signer,
    recordingOracle: Signer,
    trustedHandlers: string[];

  let token: HMToken, escrowFactory: EscrowFactory;

  before(async () => {
    [owner, reputationOracle, recordingOracle] = await ethers.getSigners();

    trustedHandlers = [
      await reputationOracle.getAddress(),
      await recordingOracle.getAddress(),
    ];

    // Deploy HMTToken Contract
    const HMToken = await ethers.getContractFactory('HMToken');
    token = await HMToken.deploy(1000000000, 'Human Token', 18, 'HMT');

    // Deploy Escrow Factory Contract
    const EscrowFactory = await ethers.getContractFactory('EscrowFactory');

    escrowFactory = await EscrowFactory.deploy(token.address);
  });

  describe('deployment', () => {
    it('Should set the right token address', async () => {
      const result = await escrowFactory.eip20();
      expect(result).to.equal(token.address);
    });

    it('Should set the right counter', async () => {
      const initialCounter = await escrowFactory.counter();
      expect(initialCounter.toString()).to.equal('0');
    });
  });

  describe('createEscrow', () => {
    describe('Events', function () {
      it('Should emit an event on launched', async function () {
        await expect(escrowFactory.connect(owner).createEscrow(trustedHandlers))
          .to.emit(escrowFactory, 'Launched')
          .withArgs(token.address, anyValue);
      });
    });

    describe('Create escrow', async function () {
      it('Should increases counter after new escrow is created', async () => {
        const initialCounter = await escrowFactory.counter();
        await escrowFactory.connect(owner).createEscrow(trustedHandlers);

        const newCounter1 = await escrowFactory.counter();
        expect(newCounter1.toString()).to.equal(
          (initialCounter.toNumber() + 1).toString()
        );

        await escrowFactory.connect(owner).createEscrow(trustedHandlers);

        const newCounter2 = await escrowFactory.counter();
        expect(newCounter2.toString()).to.equal(
          (initialCounter.toNumber() + 2).toString()
        );
      });

      it('Should finds the newly created escrow from deployed escrow', async () => {
        await escrowFactory.connect(owner).createEscrow(trustedHandlers);

        const escrowAddress = await escrowFactory.lastEscrow();
        const result = await escrowFactory
          .connect(owner)
          .hasEscrow(escrowAddress);
        expect(result).to.equal(true);
      });
    });
  });
});
