import EscrowFactoryABI from '@human-protocol/core/abis/EscrowFactory.json';
import Box from '@mui/material/Box';
import { Grid, Link, Typography } from '@mui/material';
import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import {
  FortuneStages,
  FortuneFundingMethod,
  FortuneJobRequest,
  FortuneLaunch,
  FortuneLaunchSuccess,
  FortuneLaunchFail,
} from 'src/components';
import {
  FortuneStageStatus,
  FundingMethodType,
  JobLaunchResponse,
} from 'src/components/types';
import { useSigner, useChainId } from 'wagmi';
import { ChainId, ESCROW_NETWORKS } from 'src/constants';

function RequestPage() {
  const { data: signer } = useSigner();
  const chainId = useChainId();
  const [lastEscrowAddress, setLastEscrowAddress] = useState('');
  const [status, setStatus] = useState<FortuneStageStatus>(
    FortuneStageStatus.FUNDING_METHOD
  );
  const [fundingMethod, setFundingMethod] =
    useState<FundingMethodType>('crypto');
  const [jobResponse, setJobResponse] = useState<JobLaunchResponse>({
    escrowAddress: '',
    exchangeUrl: '',
  });

  const handleChangeFundingMethod = (method: FundingMethodType) => {
    setFundingMethod(method);
    setStatus(FortuneStageStatus.JOB_REQUEST);
  };

  const handleBack = () => {
    setFundingMethod('crypto');
    setStatus(FortuneStageStatus.JOB_REQUEST);
  };

  const handleOnSuccess = (data: JobLaunchResponse) => {
    setJobResponse(data);
    setStatus(FortuneStageStatus.LAUNCH_SUCCESS);
  };

  const handleCreateNewEscrow = () => {
    setJobResponse({ escrowAddress: '', exchangeUrl: '' });
    setStatus(FortuneStageStatus.FUNDING_METHOD);
  };

  const fetchLastEscrow = async (factoryAddress: string | undefined) => {
    if (factoryAddress && signer) {
      const contract = new ethers.Contract(
        factoryAddress,
        EscrowFactoryABI,
        signer
      );
      const address = await contract.lastEscrow();
      setLastEscrowAddress(address);
    }
  };

  useEffect(() => {
    fetchLastEscrow(ESCROW_NETWORKS[chainId as ChainId]?.factoryAddress);
  }, [chainId, signer]);

  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }, pt: 10 }}>
      <Box
        sx={{
          background: '#f6f7fe',
          borderRadius: {
            xs: '16px',
            sm: '16px',
            md: '24px',
            lg: '32px',
            xl: '40px',
          },
          padding: {
            xs: '24px 16px',
            md: '42px 54px',
            lg: '56px 72px',
            xl: '70px 90px',
          },
        }}
      >
        <Box sx={{ maxWidth: '1056px', mx: 'auto' }}>
          <Typography variant="h4" fontWeight={600} mb={5}>
            Fortune Job Request
          </Typography>
          <FortuneStages status={status} />
          <Box mt={3}>
            {status === FortuneStageStatus.FUNDING_METHOD && (
              <FortuneFundingMethod onChange={handleChangeFundingMethod} />
            )}
            {status === FortuneStageStatus.JOB_REQUEST && (
              <FortuneJobRequest
                fundingMethod={fundingMethod}
                onBack={handleBack}
                onLaunch={() => setStatus(FortuneStageStatus.LAUNCH)}
                onSuccess={handleOnSuccess}
                onFail={() => setStatus(FortuneStageStatus.LAUNCH_FAIL)}
              />
            )}
            {status === FortuneStageStatus.LAUNCH && <FortuneLaunch />}
            {status === FortuneStageStatus.LAUNCH_SUCCESS && (
              <FortuneLaunchSuccess
                jobResponse={jobResponse}
                onCreateNewEscrow={handleCreateNewEscrow}
              />
            )}
            {status === FortuneStageStatus.LAUNCH_FAIL && (
              <FortuneLaunchFail
                onBack={() => setStatus(FortuneStageStatus.JOB_REQUEST)}
              />
            )}
          </Box>
          <Box my={2}>
            <Typography variant="body2">
              Last Escrow: {lastEscrowAddress}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default RequestPage;
