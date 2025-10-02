/* eslint-disable no-console */
import 'dotenv/config';
import { ethers, upgrades } from 'hardhat';

async function main() {
  const governorProxy = process.env.GOVERNOR_ADDRESS;
  const fqName =
    process.env.GOVERNOR_FQN ||
    'contracts/governance/MetaHumanGovernor.sol:MetaHumanGovernor';

  if (!governorProxy) {
    console.error('Missing env: GOVERNOR_ADDRESS');
    process.exitCode = 1;
    return;
  }

  console.log('Governor Proxy Address: ', governorProxy);
  console.log('Using implementation FQN: ', fqName);

  const beforeImpl =
    await upgrades.erc1967.getImplementationAddress(governorProxy);
  console.log('Current Governor Implementation: ', beforeImpl);

  const GovernorFactory = await ethers.getContractFactory(fqName);

  console.log('Preparing new Governor implementation...');
  const newImpl = await upgrades.prepareUpgrade(governorProxy, GovernorFactory);
  console.log('Prepared Governor Implementation: ', newImpl);

  console.log('Upgrading Governor proxy...');
  const upgraded = await upgrades.upgradeProxy(governorProxy, GovernorFactory);
  const contract = await upgraded.waitForDeployment();
  const txHash = contract.deploymentTransaction()?.hash;
  if (txHash) {
    await ethers.provider.getTransactionReceipt(txHash);
  }
  console.log('Governor proxy upgraded successfully!');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
