/* eslint-disable no-console */
import { ethers, upgrades } from 'hardhat';
import { HMToken } from 'typechain-types';

async function main() {
  const [, ...accounts] = await ethers.getSigners();
  const HMToken = await ethers.getContractFactory(
    'contracts/HMToken.sol:HMToken'
  );
  const HMTokenContract = await HMToken.deploy(
    1000000000,
    'HUMAN Token',
    18,
    'HMT'
  );
  await HMTokenContract.waitForDeployment();
  const hmtAddress = await HMTokenContract.getAddress();
  console.log('HMToken Address: ', hmtAddress);

  const Staking = await ethers.getContractFactory('Staking');
  const stakingContract = await Staking.deploy(hmtAddress, 1, 1000, 1);

  await stakingContract.waitForDeployment();
  console.log('Staking Address: ', await stakingContract.getAddress());

  const EscrowFactory = await ethers.getContractFactory(
    'contracts/EscrowFactory.sol:EscrowFactory'
  );
  const escrowFactoryContract = await upgrades.deployProxy(
    EscrowFactory,
    [await stakingContract.getAddress(), 1],
    { initializer: 'initialize', kind: 'uups' }
  );
  await escrowFactoryContract.waitForDeployment();
  console.log(
    'Escrow Factory Proxy Address: ',
    await escrowFactoryContract.getAddress()
  );
  console.log(
    'Escrow Factory Implementation Address: ',
    await upgrades.erc1967.getImplementationAddress(
      await escrowFactoryContract.getAddress()
    )
  );

  const KVStore = await ethers.getContractFactory('KVStore');
  const kvStoreContract = await KVStore.deploy();
  await kvStoreContract.waitForDeployment();

  console.log('KVStore Address: ', await kvStoreContract.getAddress());

  for (const account of accounts) {
    await (HMTokenContract as HMToken).transfer(
      account.address,
      ethers.parseEther('1000')
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
