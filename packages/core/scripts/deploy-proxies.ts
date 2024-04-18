/* eslint-disable no-console */
import { ethers, upgrades } from 'hardhat';

async function main() {
  const hmtAddress = process.env.HMT_ADDRESS;
  if (!hmtAddress) {
    console.error('HMT_ADDRESS env variable missing');
    return;
  }

  const Staking = await ethers.getContractFactory('Staking');
  const stakingContract = await upgrades.deployProxy(
    Staking,
    [hmtAddress, 1, 1],
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

  console.log('KVStore Address: ', await kvStoreContract.getAddress());

  const RewardPool = await ethers.getContractFactory('RewardPool');
  const rewardPoolContract = await upgrades.deployProxy(
    RewardPool,
    [hmtAddress, await stakingContract.getAddress(), 1],
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
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
