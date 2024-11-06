/* eslint-disable no-console */
import { ethers, upgrades } from 'hardhat';

async function main() {
  const escrowFactoryAddress = process.env.ESCROW_FACTORY_ADDRESS;
  const deployEscrowFactory = process.env.DEPLOY_ESCROW_FACTORY;
  const stakingAddress = process.env.STAKING_ADDRESS;
  const deployStaking = process.env.DEPLOY_STAKING;

  if (!escrowFactoryAddress && !stakingAddress) {
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
    const contract = await escrowFactoryContract.waitForDeployment();
    const hash = contract.deploymentTransaction()?.hash;
    if (hash) {
      await ethers.provider.getTransactionReceipt(hash);
    }

    console.log(
      'Escrow Factory Proxy Address: ',
      await escrowFactoryContract.getAddress()
    );
    console.log(
      'New Escrow Factory Implementation Address: ',
      await upgrades.erc1967.getImplementationAddress(
        await escrowFactoryContract.getAddress()
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
    const contract = await stakingContract.waitForDeployment();
    const hash = contract.deploymentTransaction()?.hash;
    if (hash) {
      await ethers.provider.getTransactionReceipt(hash);
    }

    console.log('Staking Proxy Address: ', await stakingContract.getAddress());
    console.log(
      'New Staking Implementation Address: ',
      await upgrades.erc1967.getImplementationAddress(
        await stakingContract.getAddress()
      )
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
