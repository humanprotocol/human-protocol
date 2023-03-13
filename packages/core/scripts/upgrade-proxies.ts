/* eslint-disable no-console */
import { ethers, upgrades } from 'hardhat';

async function main() {
  console.log(process.env);
  // const escrowFactoryAddress = process.env.ESCROW_FACTORY_ADDRESS;
  // if (!escrowFactoryAddress) {
  //   console.error('ESCROW_FACTORY_ADDRESS env variable missing');
  // }
  // const stakingAddress = process.env.STAKING_ADDRESS;
  // if (!stakingAddress) {
  //   console.error('STAKING_ADDRESS env variable missing');
  // }
  // const reputationAddress = process.env.REPUTATION_ADDRESS;
  // if (!reputationAddress) {
  //   console.error('REPUTATION_ADDRESS env variable missing');
  // }
  // const rewardPoolAddress = process.env.REWARD_POOL_ADDRESS;
  // if (!rewardPoolAddress) {
  //   console.error('REWARD_POOL_ADDRESS env variable missing');
  // }

  // if (escrowFactoryAddress) {
  //   const EscrowFactory = await ethers.getContractFactory('EscrowFactory');
  //   // await upgrades.forceImport(escrowFactoryAddress, EscrowFactory, { kind: 'uups' });  //use this to get ./openzeppelin/[network].json
  //   const escrowFactoryContract = await upgrades.upgradeProxy(
  //     escrowFactoryAddress,
  //     EscrowFactory
  //   );
  //   await escrowFactoryContract.deployed();
  //   console.log(
  //     'Escrow Factory Proxy Address: ',
  //     escrowFactoryContract.address
  //   );
  //   console.log(
  //     'New Escrow Factory Implementation Address: ',
  //     await upgrades.erc1967.getImplementationAddress(
  //       escrowFactoryContract.address
  //     )
  //   );
  // }

  // if (stakingAddress) {
  //   const Staking = await ethers.getContractFactory('Staking');
  //   const stakingContract = await upgrades.upgradeProxy(
  //     stakingAddress,
  //     Staking
  //   );
  //   await stakingContract.deployed();
  //   console.log('Staking Proxy Address: ', stakingContract.address);
  //   console.log(
  //     'New Staking Implementation Address: ',
  //     await upgrades.erc1967.getImplementationAddress(stakingContract.address)
  //   );
  // }

  // if (rewardPoolAddress) {
  //   const RewardPool = await ethers.getContractFactory('RewardPool');
  //   const rewardPoolContract = await upgrades.upgradeProxy(
  //     rewardPoolAddress,
  //     RewardPool
  //   );
  //   await rewardPoolContract.deployed();
  //   console.log('Reward Pool Proxy Address: ', rewardPoolContract.address);
  //   console.log(
  //     'New Reward Pool Implementation Address: ',
  //     await upgrades.erc1967.getImplementationAddress(
  //       rewardPoolContract.address
  //     )
  //   );
  // }

  // if (reputationAddress) {
  //   const Reputation = await ethers.getContractFactory('Reputation');
  //   const reputationContract = await upgrades.upgradeProxy(
  //     reputationAddress,
  //     Reputation
  //   );
  //   await reputationContract.deployed();
  //   console.log('Reputation Proxy Address: ', reputationContract.address);
  //   console.log(
  //     'New Reputation Implementation Address: ',
  //     await upgrades.erc1967.getImplementationAddress(
  //       reputationContract.address
  //     )
  //   );
  // }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
