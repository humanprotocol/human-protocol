/* eslint-disable no-console */
import { ethers, upgrades } from 'hardhat';

async function main() {
  const [, ...accounts] = await ethers.getSigners();
  const HMToken = await ethers.getContractFactory('HMToken');
  const HMTokenContract = await HMToken.deploy(
    1000000000,
    'Human Token',
    18,
    'HMT'
  );
  await HMTokenContract.deployed();
  console.log('HMToken Address: ', HMTokenContract.address);

  const Staking = await ethers.getContractFactory('Staking');
  const stakingContract = await upgrades.deployProxy(
    Staking,
    [HMTokenContract.address, 1, 10],
    { initializer: 'initialize', kind: 'uups' }
  );
  await stakingContract.deployed();
  console.log('Staking Proxy Address: ', stakingContract.address);
  console.log(
    'Staking Implementation Address: ',
    await upgrades.erc1967.getImplementationAddress(stakingContract.address)
  );

  const EscrowFactory = await ethers.getContractFactory('EscrowFactory');
  const escrowFactoryContract = await upgrades.deployProxy(
    EscrowFactory,
    [stakingContract.address],
    { initializer: 'initialize', kind: 'uups' }
  );
  await escrowFactoryContract.deployed();
  console.log('Escrow Factory Proxy Address: ', escrowFactoryContract.address);
  console.log(
    'Escrow Factory Implementation Address: ',
    await upgrades.erc1967.getImplementationAddress(
      escrowFactoryContract.address
    )
  );

  const KVStore = await ethers.getContractFactory('KVStore');
  const kvStoreContract = await KVStore.deploy();
  await kvStoreContract.deployed();

  console.log('KVStore Address: ', kvStoreContract.address);

  const RewardPool = await ethers.getContractFactory('RewardPool');
  const rewardPoolContract = await upgrades.deployProxy(
    RewardPool,
    [HMTokenContract.address, stakingContract.address, 1],
    { initializer: 'initialize', kind: 'uups' }
  );
  await rewardPoolContract.deployed();
  console.log('Reward Pool Proxy Address: ', rewardPoolContract.address);
  console.log(
    'Reward Pool Implementation Address: ',
    await upgrades.erc1967.getImplementationAddress(rewardPoolContract.address)
  );

  // Configure RewardPool in Staking
  await stakingContract.setRewardPool(rewardPoolContract.address);

  for (const account of accounts) {
    await HMTokenContract.transfer(
      account.address,
      ethers.utils.parseEther('1000')
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
