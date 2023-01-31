import HMTokenABI from '@human-protocol/core/abis/HMToken.json';
import Box from '@mui/material/Box';
import { Grid, Link, Typography } from '@mui/material';
import axios from 'axios';
import React, { useState } from 'react';
import {
  FortuneStages,
  FortuneFundingMethod,
  FortuneJobRequest,
  FortuneLaunch,
  FortuneLaunchSuccess,
  FortuneLaunchFail,
} from 'src/components/Fortune';
import {
  FortuneJobRequestType,
  FortuneStageStatus,
  FundingMethodType,
} from 'src/components/Fortune/types';
import { ethers } from 'ethers';
import { useSigner } from 'wagmi';
import { ChainId, ESCROW_NETWORKS, HM_TOKEN_DECIMALS } from 'src/constants';

export const FortunePage: React.FC = (): React.ReactElement => {
  const { data: signer } = useSigner();
  const [status, setStatus] = useState<FortuneStageStatus>(
    FortuneStageStatus.FUNDING_METHOD
  );
  const [fundingMethod, setFundingMethod] =
    useState<FundingMethodType>('crypto');

  const handleChangeFundingMethod = (method: FundingMethodType) => {
    setFundingMethod(method);
    setStatus(FortuneStageStatus.JOB_REQUEST);
  };

  const handleBack = () => {
    setFundingMethod('crypto');
    setStatus(FortuneStageStatus.JOB_REQUEST);
  };

  const handleLaunch = async (data: FortuneJobRequestType) => {
    if (!signer) return;
    try {
      const contract = new ethers.Contract(data.token, HMTokenABI, signer);
      const escrowFactoryAddress =
        ESCROW_NETWORKS[data.chainId as ChainId]?.factoryAddress;

      await contract.approve(
        escrowFactoryAddress,
        ethers.utils.parseUnits(data.fundAmount.toString(), HM_TOKEN_DECIMALS)
      );

      const baseUrl = process.env.REACT_APP_JOB_LAUNCHER_SERVER_URL;
      setStatus(FortuneStageStatus.LAUNCH);
      await axios.post(`${baseUrl}/escrow`, data);
      setStatus(FortuneStageStatus.LAUNCH_SUCCESS);
    } catch (err) {
      console.log(err);
      setStatus(FortuneStageStatus.LAUNCH_FAIL);
    }
  };

  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 } }}>
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
              {status === FortuneStageStatus.JOB_REQUEST && (
                <FortuneJobRequest
                  fundingMethod={fundingMethod}
                  onBack={handleBack}
                  onLaunch={handleLaunch}
                />
              )}
              {status === FortuneStageStatus.LAUNCH && <FortuneLaunch />}
              {status === FortuneStageStatus.LAUNCH_SUCCESS && (
                <FortuneLaunchSuccess />
              )}
              {status === FortuneStageStatus.LAUNCH_FAIL && (
                <FortuneLaunchFail
                  onBack={() => setStatus(FortuneStageStatus.JOB_REQUEST)}
                />
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};
