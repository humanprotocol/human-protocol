/* eslint-disable no-console */
import { StakingUtils } from '../src/staking';
import { ChainId, OrderDirection } from '../src/enums';
import { ethers } from 'ethers';

const runStakingExamples = async () => {
  const stakers = await StakingUtils.getStakers({
    chainId: ChainId.POLYGON_AMOY,
    maxLockedAmount: ethers.parseEther('5').toString(),
    orderBy: 'lastDepositTimestamp',
    orderDirection: OrderDirection.ASC,
    first: 5,
    skip: 0,
  });
  console.log('Filtered stakers:', stakers);

  try {
    const staker = await StakingUtils.getStaker(
      ChainId.POLYGON_AMOY,
      stakers[0].address
    );
    console.log('Staker info:', staker);
  } catch (e) {
    console.log('Staker not found');
  }
};

(async () => {
  await runStakingExamples();
})();
