import StakingABI from '@human-protocol/core/abis/Staking.json';
import { BigNumber, ethers } from 'ethers';
import { useEffect, useState } from 'react';

import { STAKING_CONTRACT_ADDRESS } from 'src/constants';

type Staker = {
  address: string;
  role: number;
  tokensAllocated: BigNumber;
  tokensLocked: BigNumber;
  tokensLockedUntil: BigNumber;
  tokensStaked: BigNumber;
};

export const useLeaderboardData = () => {
  const [stakers, setStakers] = useState<Staker[]>();

  const fetchListOfStakers = async () => {
    const rpcUrl = 'https://rpc-mumbai.maticvigil.com';
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(
      STAKING_CONTRACT_ADDRESS,
      StakingABI,
      provider
    );
    const listOfStakersByRoles = await Promise.all([
      contract.getListOfStakers(1),
      contract.getListOfStakers(2),
      contract.getListOfStakers(3),
      contract.getListOfStakers(4),
      contract.getListOfStakers(5),
    ]);
    const allStakers = listOfStakersByRoles
      .map((listOfStakers: any) => {
        const stakerAddresses = listOfStakers[0];
        const stakerInfos = listOfStakers[1];
        return stakerAddresses.map((address: string, i: number) => ({
          address,
          role: stakerInfos[i].role,
          tokensAllocated: stakerInfos[i].tokensAllocated,
          tokensLocked: stakerInfos[i].tokensLocked,
          tokensLockedUntil: stakerInfos[i].tokensLockedUntil,
          tokensStaked: stakerInfos[i].tokensStaked,
        }));
      })
      .flat();

    setStakers(allStakers);
  };

  useEffect(() => {
    fetchListOfStakers();
  }, []);

  return stakers;
};
