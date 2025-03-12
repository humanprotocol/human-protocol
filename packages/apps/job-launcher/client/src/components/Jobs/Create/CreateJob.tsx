import { ChainId } from '@human-protocol/sdk';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import React, { useEffect } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { NetworkSelect } from '../../../components/NetworkSelect';
import { IS_MAINNET } from '../../../constants/chains';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';
import { JobType, PayMethod } from '../../../types';
import { CvatJobRequestForm } from './CvatJobRequestForm';
import { FortuneJobRequestForm } from './FortuneJobRequestForm';
import { HCaptchaJobRequestForm } from './HCaptchaJobRequestForm';

export const CreateJob = () => {
  const { payMethod, jobRequest, updateJobRequest } = useCreateJobPageUI();
  const { chainId } = jobRequest;
  const { chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  useEffect(() => {
    if (payMethod === PayMethod.Crypto && chainId && chainId !== chain?.id) {
      switchChainAsync?.({ chainId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payMethod, chainId]);

  return (
    <Box
      sx={{
        py: 6,
        px: 7,
        background: '#fff',
        borderRadius: '16px',
        boxShadow:
          '0px 1px 5px 0px rgba(233, 235, 250, 0.20), 0px 2px 2px 0px rgba(233, 235, 250, 0.50), 0px 3px 1px -2px #E9EBFA',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <FormControl variant="standard" sx={{ minWidth: 220 }}>
          <InputLabel id="job-type-select-label">Job Type</InputLabel>
          <Select
            labelId="job-type-select-label"
            id="job-type-select"
            label={'Job Type'}
            sx={{
              '.MuiSelect-select': {
                display: 'flex',
                alignItems: 'center',
                paddingTop: '8px',
                paddingBottom: '8px',
                minWidth: '300px',
                '.MuiListItemIcon-root': {
                  minWidth: '36px',
                },
              },
            }}
            value={jobRequest.jobType}
            onChange={(e) =>
              updateJobRequest?.({
                ...jobRequest,
                jobType: e.target.value as JobType,
              })
            }
          >
            {!IS_MAINNET && (
              <MenuItem value={JobType.Fortune}>Fortune</MenuItem>
            )}
            <MenuItem value={JobType.CVAT}>CVAT</MenuItem>
            {/* {!IS_MAINNET && (
              <MenuItem value={JobType.HCAPTCHA}>hCaptcha</MenuItem>
            )} */}
          </Select>
        </FormControl>
        <NetworkSelect
          label="Choose Network"
          value={jobRequest.chainId}
          onChange={(e) =>
            updateJobRequest?.({
              ...jobRequest,
              chainId: e.target.value as ChainId,
            })
          }
        />
      </Box>
      {jobRequest.jobType === JobType.Fortune && <FortuneJobRequestForm />}
      {jobRequest.jobType === JobType.CVAT && <CvatJobRequestForm />}
      {jobRequest.jobType === JobType.HCAPTCHA && <HCaptchaJobRequestForm />}
    </Box>
  );
};
