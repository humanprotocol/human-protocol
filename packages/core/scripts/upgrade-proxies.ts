/* eslint-disable no-console */
import { ethers, upgrades } from 'hardhat';

async function main() {
  const escrowFactoryAddress = process.env.ESCROW_FACTORY_ADDRESS;
  const deployEscrowFactory = process.env.DEPLOY_ESCROW_FACTORY;
  const stakingAddress = process.env.STAKING_ADDRESS;
  const deployStaking = process.env.DEPLOY_STAKING;
  const rewardPoolAddress = process.env.REWARD_POOL_ADDRESS;
  const deployRewardPool = process.env.DEPLOY_REWARD_POOL;

  if (!escrowFactoryAddress && !stakingAddress && !rewardPoolAddress) {
    console.error('Env variable missing');
    return;
  }

  if (deployEscrowFactory == 'true' && escrowFactoryAddress) {
    const EscrowFactory = await ethers.getContractFactory(
      'contracts/EscrowFactory.sol:EscrowFactory'
    );
    // await upgrades.forceImport(escrowFactoryAddress, EscrowFactory, { kind: 'uups' });  //use this to get ./openzeppelin/[network].json
    const escrowFactoryContract = await upgrades.upgradeProxy(
      escrowFactoryAddress,
      EscrowFactory
    );
    const contract = await escrowFactoryContract.deployed();
    await ethers.provider.getTransactionReceipt(
      contract.deployTransaction.hash
    );

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

  if (deployStaking == 'true' && stakingAddress) {
    const Staking = await ethers.getContractFactory('Staking');
    // await upgrades.forceImport(stakingAddress, Staking, { kind: 'uups' }); //use this to get ./openzeppelin/[network].json
    const stakingContract = await upgrades.upgradeProxy(
      stakingAddress,
      Staking
    );
    const contract = await stakingContract.deployed();
    await ethers.provider.getTransactionReceipt(
      contract.deployTransaction.hash
    );

    console.log('Staking Proxy Address: ', stakingContract.address);
    console.log(
      'New Staking Implementation Address: ',
      await upgrades.erc1967.getImplementationAddress(stakingContract.address)
    );
  }

  if (deployRewardPool == 'true' && rewardPoolAddress) {
    const RewardPool = await ethers.getContractFactory('RewardPool');
    // await upgrades.forceImport(rewardPoolAddress, RewardPool, { kind: 'uups' }); //use this to get ./openzeppelin/[network].json
    const rewardPoolContract = await upgrades.upgradeProxy(
      rewardPoolAddress,
      RewardPool
    );
    const contract = await rewardPoolContract.deployed();
    await ethers.provider.getTransactionReceipt(
      contract.deployTransaction.hash
    );

    console.log('Reward Pool Proxy Address: ', rewardPoolContract.address);
    console.log(
      'New Reward Pool Implementation Address: ',
      await upgrades.erc1967.getImplementationAddress(
        rewardPoolContract.address
      )
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
