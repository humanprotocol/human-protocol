import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import React, { useState } from 'react';
import {
  FortuneStages,
  FortuneFundingMethod,
  FortuneJobRequest,
  FortuneLaunch,
  FortuneLaunchSuccess,
  FortuneLaunchFail,
} from 'src/components';
import { FortuneStageStatus, FundingMethodType } from 'src/components/types';

function RequestPage() {
  const [status, setStatus] = useState<FortuneStageStatus>(
    FortuneStageStatus.FUNDING_METHOD
  );
  const [fundingMethod, setFundingMethod] =
    useState<FundingMethodType>('crypto');
  const [escrowAddress, setEscrowAddress] = useState<string>('');

  const handleChangeFundingMethod = (method: FundingMethodType) => {
    setFundingMethod(method);
    setStatus(FortuneStageStatus.JOB_REQUEST);
  };

  const handleBack = () => {
    setFundingMethod('crypto');
    setStatus(FortuneStageStatus.JOB_REQUEST);
  };

  const handleOnSuccess = (escrowAddress: string) => {
    setEscrowAddress(escrowAddress);
    setStatus(FortuneStageStatus.LAUNCH_SUCCESS);
  };

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
              <FortuneLaunchSuccess escrowAddress={escrowAddress} />
            )}
            {status === FortuneStageStatus.LAUNCH_FAIL && (
              <FortuneLaunchFail
                onBack={() => setStatus(FortuneStageStatus.JOB_REQUEST)}
              />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default RequestPage;
