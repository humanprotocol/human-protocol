import { ethers } from 'hardhat';
import dotenv from 'dotenv';
import { getProposal } from './proposal';

dotenv.config();

async function main() {
  const deployerPrivateKey = process.env.PRIVATE_KEY;
  const governorAddress = process.env.GOVERNOR_ADDRESS || '';

  if (!deployerPrivateKey || !governorAddress) {
    throw new Error('One or more required environment variables are missing.');
  }

  const deployerSigner = new ethers.Wallet(deployerPrivateKey, ethers.provider);
  const governanceContract = await ethers.getContractAt(
    'MetaHumanGovernor',
    governorAddress,
    deployerSigner
  );

  const proposal = await getProposal();
  // Create proposal
  const transactionResponse = await governanceContract.crossChainPropose(
    proposal.targets,
    proposal.values,
    proposal.calldatas,
    proposal.description,
    { value: ethers.parseEther('0.01') }
  );

  await transactionResponse.wait();
  console.log('Proposal created:');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
