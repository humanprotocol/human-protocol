import EscrowFactoryABI from '@human-protocol/core/abis/EscrowFactory.json';
import Box from '@mui/material/Box';
import { Grid, Link, Typography } from '@mui/material';
import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import {
  FortuneStages,
  FortuneFundingMethod,
  FortuneJobRequest,
  FortuneFiatJobRequest,
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
import { ChainId, ESCROW_NETWORKS } from './constants';

function App() {
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
  const [errorMessage, setErrorMessage] = useState('');

  const handleChangeFundingMethod = (method: FundingMethodType) => {
    setFundingMethod(method);
    setStatus(FortuneStageStatus.JOB_REQUEST);
  };

  const handleBack = () => {
    setStatus(status > 0 ? status - 1 : 0);
  };

  const handleOnSuccess = (data: JobLaunchResponse) => {
    setJobResponse(data);
    setStatus(FortuneStageStatus.LAUNCH_SUCCESS);
  };

  const handleCreateNewEscrow = () => {
    setJobResponse({ escrowAddress: '', exchangeUrl: '' });
    setStatus(FortuneStageStatus.FUNDING_METHOD);
  };

  const handleOnError = (message: string) => {
    setErrorMessage(message);
    setStatus(FortuneStageStatus.LAUNCH_FAIL);
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
        <Grid container spacing={4}>
          {status === FortuneStageStatus.FUNDING_METHOD && (
            <Grid item xs={12} sm={12} md={5} lg={4}>
              <Typography color="primary" fontWeight={600} variant="h4">
                Fortune
              </Typography>
              <Typography color="primary" fontWeight={500} variant="h6">
                HUMAN Protocol basic functionality demo
              </Typography>
              <Typography mt={4} color="primary" variant="body2">
                Based on an old Unix program in which a pseudorandom message is
                displayed from a database of quotations, created by the
                community. We&apos;re adopting this basic idea, and
                decentralizing it, placing the basic ask-and-receive
                functionality on-chain.
              </Typography>
              <Link
                href="#"
                sx={{ textDecoration: 'none', mt: 1, display: 'block' }}
              >
                <Typography color="primary" fontWeight={600} variant="body2">
                  Blog Article
                </Typography>
              </Link>
            </Grid>
          )}
          <Grid
            item
            xs={12}
            sm={12}
            md={status === FortuneStageStatus.FUNDING_METHOD ? 7 : 12}
            lg={status === FortuneStageStatus.FUNDING_METHOD ? 7 : 12}
          >
            <FortuneStages status={status} />
            <Box mt={3}>
              {status === FortuneStageStatus.FUNDING_METHOD && (
                <FortuneFundingMethod onChange={handleChangeFundingMethod} />
              )}
              {status === FortuneStageStatus.JOB_REQUEST &&
                fundingMethod === 'crypto' && (
                  <FortuneJobRequest
                    fundingMethod={fundingMethod}
                    onBack={handleBack}
                    onLaunch={() => setStatus(FortuneStageStatus.LAUNCH)}
                    onSuccess={handleOnSuccess}
                    onFail={handleOnError}
                  />
                )}
              {status === FortuneStageStatus.JOB_REQUEST &&
                fundingMethod === 'fiat' && (
                  <FortuneFiatJobRequest
                    fundingMethod={fundingMethod}
                    onBack={handleBack}
                    onLaunch={() => setStatus(FortuneStageStatus.LAUNCH)}
                    onSuccess={handleOnSuccess}
                    onFail={handleOnError}
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
                  message={errorMessage}
                  onBack={() => setStatus(FortuneStageStatus.JOB_REQUEST)}
                />
              )}
            </Box>
            <Box my={2}>
              {lastEscrowAddress && (
                <Typography variant="body2">
                  Last Escrow: {lastEscrowAddress}
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default App;
