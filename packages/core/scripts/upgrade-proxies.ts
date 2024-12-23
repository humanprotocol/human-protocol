/* eslint-disable no-console */
import { ethers, upgrades } from 'hardhat';

async function main() {
  const escrowFactoryAddress = process.env.ESCROW_FACTORY_ADDRESS;
  const deployEscrowFactory = process.env.DEPLOY_ESCROW_FACTORY;

  if (!escrowFactoryAddress) {
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
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
