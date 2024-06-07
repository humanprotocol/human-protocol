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
  console.log('HMToken Address: ', await HMTokenContract.getAddress());

  const Staking = await ethers.getContractFactory('Staking');
  const stakingContract = await upgrades.deployProxy(
    Staking,
    [await HMTokenContract.getAddress(), 1, 10],
    { initializer: 'initialize', kind: 'uups' }
  );

  await stakingContract.waitForDeployment();
  console.log('Staking Proxy Address: ', await stakingContract.getAddress());
  console.log(
    'Staking Implementation Address: ',
    await upgrades.erc1967.getImplementationAddress(
      await stakingContract.getAddress()
    )
  );

  const EscrowFactory = await ethers.getContractFactory(
    'contracts/EscrowFactory.sol:EscrowFactory'
  );
  const escrowFactoryContract = await upgrades.deployProxy(
    EscrowFactory,
    [await stakingContract.getAddress()],
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

  const RewardPool = await ethers.getContractFactory('RewardPool');
  const rewardPoolContract = await upgrades.deployProxy(
    RewardPool,
    [await HMTokenContract.getAddress(), await stakingContract.getAddress(), 1],
    { initializer: 'initialize', kind: 'uups' }
  );
  await rewardPoolContract.waitForDeployment();
  console.log(
    'Reward Pool Proxy Address: ',
    await rewardPoolContract.getAddress()
  );
  console.log(
    'Reward Pool Implementation Address: ',
    await upgrades.erc1967.getImplementationAddress(
      await rewardPoolContract.getAddress()
    )
  );

  // Configure RewardPool in Staking
  await stakingContract.setRewardPool(await rewardPoolContract.getAddress());

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
