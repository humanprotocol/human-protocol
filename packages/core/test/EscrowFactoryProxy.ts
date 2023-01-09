import { expect } from 'chai';
import { Contract, Signer } from 'ethers';
import { ethers, upgrades } from 'hardhat';
import { HMToken, Staking } from '../typechain-types';

let escrowFactoryProxyContract: Contract,
  HMTokenContract: HMToken,
  stakingContract: Staking,
  adminImplementation: Contract;
let owner: Signer, account1: Signer;

describe('EscrowFactoryProxy', function () {
  this.beforeAll(async () => {
    [owner, account1] = await ethers.getSigners();
    const HMToken = await ethers.getContractFactory('HMToken');
    HMTokenContract = await HMToken.deploy(
      1000000000,
      'Human Token',
      18,
      'HMT'
    );
    await HMTokenContract.deployed();

    const Staking = await ethers.getContractFactory('Staking');
    stakingContract = await Staking.deploy(HMTokenContract.address, 1, 1);
    await stakingContract.deployed();
  });

  this.beforeEach(async () => {
    const EscrowFactory = await ethers.getContractFactory('EscrowFactory');
    escrowFactoryProxyContract = await upgrades.deployProxy(
      EscrowFactory,
      [HMTokenContract.address, stakingContract.address],
      { initializer: 'initialize' }
    );
    await escrowFactoryProxyContract.deployed();

    adminImplementation = await upgrades.admin.getInstance();
  });

  it('Deploy proxy factory', async function () {
    const adminAddress = await upgrades.erc1967.getAdminAddress(
      escrowFactoryProxyContract.address
    );
    const implementationAddress =
      await upgrades.erc1967.getImplementationAddress(
        escrowFactoryProxyContract.address
      );

    expect(adminAddress).to.equal(adminImplementation.address);
    expect(adminAddress).to.equal(
      await adminImplementation.getProxyAdmin(
        escrowFactoryProxyContract.address
      )
    );
    expect(implementationAddress).to.equal(
      await adminImplementation.getProxyImplementation(
        escrowFactoryProxyContract.address
      )
    );
  });

  it('Check proxy storage', async function () {
    expect(HMTokenContract.address).to.equal(
      await escrowFactoryProxyContract.eip20()
    );
    expect(stakingContract.address).to.equal(
      await escrowFactoryProxyContract.staking()
    );
  });

  it('Check implementation storage', async function () {
    const escrowFactoryImplementation = await ethers.getContractAt(
      'EscrowFactory',
      await upgrades.erc1967.getImplementationAddress(
        escrowFactoryProxyContract.address
      )
    );
    expect(await escrowFactoryImplementation.eip20()).to.equal(
      ethers.constants.Zero
    );
    expect(await escrowFactoryImplementation.staking()).to.equal(
      ethers.constants.Zero
    );
  });

  it('Upgrade proxy', async function () {
    expect(
      await escrowFactoryProxyContract.hasEscrow(owner.getAddress())
    ).to.equal(false);

    const EscrowFactory = await ethers.getContractFactory(
      'EscrowFactoryUpgradeTest'
    );
    escrowFactoryProxyContract = await upgrades.upgradeProxy(
      escrowFactoryProxyContract,
      EscrowFactory
    );
    await expect(() => {
      escrowFactoryProxyContract.hasEscrow(owner.getAddress());
    }).to.throw(
      TypeError,
      'escrowFactoryProxyContract.hasEscrow is not a function'
    );

    expect(HMTokenContract.address).to.equal(
      await escrowFactoryProxyContract.eip20()
    );
    expect(stakingContract.address).to.equal(
      await escrowFactoryProxyContract.staking()
    );
  });

  it('Revert when updating with a non contract address', async function () {
    await expect(
      adminImplementation.upgrade(
        escrowFactoryProxyContract.address,
        owner.getAddress()
      )
    ).to.be.revertedWith('ERC1967: new implementation is not a contract');
  });

  it('Only admin can modify', async function () {
    expect(await adminImplementation.owner()).to.equal(
      await owner.getAddress()
    );

    await expect(
      adminImplementation
        .connect(account1)
        .upgrade(escrowFactoryProxyContract.address, owner.getAddress())
    ).to.be.revertedWith('Ownable: caller is not the owner');

    adminImplementation.transferOwnership(account1.getAddress());
    expect(await adminImplementation.owner()).to.equal(
      await account1.getAddress()
    );

    await expect(
      adminImplementation.upgrade(
        escrowFactoryProxyContract.address,
        owner.getAddress()
      )
    ).to.be.revertedWith('Ownable: caller is not the owner');
  });
});
