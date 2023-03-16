/* eslint-disable no-console */
import { ethers, upgrades } from 'hardhat';

async function main() {
  const escrowFactoryAddress = process.env.ESCROW_FACTORY_ADDRESS;
  const stakingAddress = process.env.STAKING_ADDRESS;
  const reputationAddress = process.env.REPUTATION_ADDRESS;
  const rewardPoolAddress = process.env.REWARD_POOL_ADDRESS;

  if (
    !escrowFactoryAddress &&
    !stakingAddress &&
    !rewardPoolAddress &&
    !reputationAddress
  ) {
    console.error('Env variable missing');
  }

  if (escrowFactoryAddress) {
    const EscrowFactory = await ethers.getContractFactory('EscrowFactory');
    // await upgrades.forceImport(escrowFactoryAddress, EscrowFactory, { kind: 'uups' });  //use this to get ./openzeppelin/[network].json
    const escrowFactoryContract = await upgrades.upgradeProxy(
      escrowFactoryAddress,
      EscrowFactory
    );
    await escrowFactoryContract.deployed();
    console.log(
      'Escrow Factory Proxy Address: ',
      escrowFactoryContract.address
    );
    console.log(
      'New Escrow Factory Implementation Address: ',
      await upgrades.erc1967.getImplementationAddress(
        escrowFactoryContract.address
      )
    );
  }

  if (stakingAddress) {
    const Staking = await ethers.getContractFactory('Staking');
    const stakingContract = await upgrades.upgradeProxy(
      stakingAddress,
      Staking
    );
    await stakingContract.deployed();
    console.log('Staking Proxy Address: ', stakingContract.address);
    console.log(
      'New Staking Implementation Address: ',
      await upgrades.erc1967.getImplementationAddress(stakingContract.address)
    );
  }

  if (rewardPoolAddress) {
    const RewardPool = await ethers.getContractFactory('RewardPool');
    const rewardPoolContract = await upgrades.upgradeProxy(
      rewardPoolAddress,
      RewardPool
    );
    await rewardPoolContract.deployed();
    console.log('Reward Pool Proxy Address: ', rewardPoolContract.address);
    console.log(
      'New Reward Pool Implementation Address: ',
      await upgrades.erc1967.getImplementationAddress(
        rewardPoolContract.address
      )
    );
  }

  if (reputationAddress) {
    const Reputation = await ethers.getContractFactory('Reputation');
    const reputationContract = await upgrades.upgradeProxy(
      reputationAddress,
      Reputation
    );
    await reputationContract.deployed();
    console.log('Reputation Proxy Address: ', reputationContract.address);
    console.log(
      'New Reputation Implementation Address: ',
      await upgrades.erc1967.getImplementationAddress(
        reputationContract.address
      )
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
