import { ethers, network } from 'hardhat';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const deployerPrivateKey = process.env.PRIVATE_KEY;
  const governorAddress = process.env.GOVERNOR_ADDRESS || '';
  const hmtTokenAddress = process.env.HMT_TOKEN_ADDRESS || '';
  const description = process.env.DESCRIPTION || '';

  if (
    !deployerPrivateKey ||
    !governorAddress ||
    !hmtTokenAddress ||
    !description
  ) {
    throw new Error('One or more required environment variables are missing.');
  }

  const deployerSigner = new ethers.Wallet(deployerPrivateKey, ethers.provider);
  const governanceContract = await ethers.getContractAt(
    'MetaHumanGovernor',
    governorAddress,
    deployerSigner
  );

  const hmToken = await ethers.getContractAt('IERC20', hmtTokenAddress);

  const encodedCall = hmToken.interface.encodeFunctionData('transfer', [
    await deployerSigner.getAddress(),
    ethers.parseEther('1'),
  ]);

  // Proposal data
  const targets = [hmtTokenAddress];
  const values = [0];
  const calldatas = [encodedCall];

  // Create proposal
  const transactionResponse = await governanceContract.crossChainPropose(
    targets,
    values,
    calldatas,
    description,
    { value: ethers.parseEther('0.1') }
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
