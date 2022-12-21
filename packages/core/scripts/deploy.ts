/* eslint-disable no-console */
import { ethers } from 'hardhat';

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
  const stakingContract = await Staking.deploy(HMTokenContract.address, 1, 1);
  await stakingContract.deployed();
  console.log('Staking Contract Address:', stakingContract.address);

  const EscrowFactory = await ethers.getContractFactory('EscrowFactory');
  const escrowFactoryContract = await EscrowFactory.deploy(
    HMTokenContract.address,
    stakingContract.address
  );
  await escrowFactoryContract.deployed();

  console.log('Escrow Factory Address: ', escrowFactoryContract.address);

  const KVStore = await ethers.getContractFactory('KVStore');
  const kvStoreContract = await KVStore.deploy();
  await kvStoreContract.deployed();

  console.log('KVStore Address: ', kvStoreContract.address);

  const RewardPool = await ethers.getContractFactory('RewardPool');
  const rewardPoolContract = await RewardPool.deploy(
    HMTokenContract.address,
    stakingContract.address,
    1
  );
  await rewardPoolContract.deployed();
  console.log('Reward Pool Contract Address:', rewardPoolContract.address);

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
