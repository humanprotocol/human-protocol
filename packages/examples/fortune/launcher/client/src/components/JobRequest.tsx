import HMTokenABI from '@human-protocol/core/abis/HMToken.json';
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import axios from 'axios';
import { ethers } from 'ethers';
import {
  SUPPORTED_CHAIN_IDS,
  ESCROW_NETWORKS,
  ChainId,
  HM_TOKEN_DECIMALS,
} from '../constants';
import React, { useEffect, useState } from 'react';
import { useAccount, useChainId, useSigner, useSwitchNetwork } from 'wagmi';
import { RoundedBox } from './RoundedBox';
import {
  FortuneJobRequestType,
  FundingMethodType,
  JobLaunchResponse,
} from './types';

type JobRequestProps = {
  fundingMethod: FundingMethodType;
  onBack: () => void;
  onLaunch: () => void;
  onSuccess: (response: JobLaunchResponse) => void;
  onFail: () => void;
};

export const JobRequest = ({
  fundingMethod,
  onBack,
  onLaunch,
  onSuccess,
  onFail,
}: JobRequestProps) => {
  const { address } = useAccount();
  const { data: signer } = useSigner();
  const chainId = useChainId();
  const { switchNetwork } = useSwitchNetwork();
  const [jobRequest, setJobRequest] = useState<FortuneJobRequestType>({
    chainId: SUPPORTED_CHAIN_IDS.includes(ChainId.LOCALHOST)
      ? ChainId.LOCALHOST
      : SUPPORTED_CHAIN_IDS.includes(ChainId.POLYGON_MUMBAI)
      ? ChainId.POLYGON_MUMBAI
      : SUPPORTED_CHAIN_IDS[0],
    title: '',
    description: '',
    fortunesRequired: '',
    token: '',
    fundAmount: '',
    jobRequester: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleJobRequestFormFieldChange = (
    fieldName: string,
    fieldValue: any
  ) => {
    const regex = /^[0-9\b]+$/;
    if (fieldName !== 'fortunesRequired') {
      setJobRequest({ ...jobRequest, [fieldName]: fieldValue });
    } else if (regex.test(fieldValue) || fieldValue === '') {
      setJobRequest({ ...jobRequest, [fieldName]: fieldValue });
    }
  };

  const handleLaunch = async () => {
    if (!signer || !address) return;

    if (chainId !== jobRequest.chainId) {
      switchNetwork?.(jobRequest.chainId);
      return;
    }

    setIsLoading(true);
    const data: FortuneJobRequestType = {
      ...jobRequest,
      jobRequester: address,
      token: ESCROW_NETWORKS[jobRequest.chainId as ChainId]?.hmtAddress!,
    };
    try {
      const contract = new ethers.Contract(data.token, HMTokenABI, signer);
      const jobLauncherAddress = process.env.REACT_APP_JOB_LAUNCHER_ADDRESS;
      if (!jobLauncherAddress) {
        alert('Job Launcher address is missing');
        setIsLoading(false);
        return;
      }
      const allowance = await contract.allowance(address, jobLauncherAddress);

      if (
        allowance.lt(
          ethers.utils.parseUnits(data.fundAmount, HM_TOKEN_DECIMALS)
        )
      ) {
        const tx = await contract.approve(
          jobLauncherAddress,
          ethers.utils.parseUnits(data.fundAmount, HM_TOKEN_DECIMALS)
        );
        const receipt = await tx.wait();
        console.log(receipt);
      }

      const baseUrl = process.env.REACT_APP_JOB_LAUNCHER_SERVER_URL;
      onLaunch();
      const result = await axios.post(`${baseUrl}/escrow`, data);
      onSuccess(result.data);
    } catch (err) {
      console.log(err);
      onFail();
    }

    setIsLoading(false);
  };

  return (
    <RoundedBox sx={{ p: '50px 140px' }}>
      <Typography variant="body2" color="primary" mb={4}>
        Job Details
      </Typography>
      <Box sx={{ display: 'flex', gap: 4 }}>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <FormControl sx={{ minWidth: 240 }} size="small">
            <InputLabel>Network</InputLabel>
            <Select
              label="Network"
              variant="outlined"
              value={jobRequest.chainId}
              onChange={(e) =>
                handleJobRequestFormFieldChange(
                  'chainId',
                  Number(e.target.value)
                )
              }
            >
              {SUPPORTED_CHAIN_IDS.map((chainId) => (
                <MenuItem key={chainId} value={chainId}>
                  {ESCROW_NETWORKS[chainId]?.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Grid container sx={{ width: '100%' }} spacing={3}>
            <Grid item xs={12} sm={12} md={6}>
              <FormControl fullWidth>
                <TextField
                  placeholder="Title"
                  value={jobRequest.title}
                  onChange={(e) =>
                    handleJobRequestFormFieldChange('title', e.target.value)
                  }
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <FormControl fullWidth>
                <TextField
                  placeholder="Fortunes Requested"
                  type="number"
                  inputProps={{ min: 0, step: 1 }}
                  value={jobRequest.fortunesRequired}
                  onChange={(e) =>
                    handleJobRequestFormFieldChange(
                      'fortunesRequired',
                      e.target.value
                    )
                  }
                />
              </FormControl>
            </Grid>
          </Grid>
          <FormControl fullWidth>
            <TextField
              placeholder="Description"
              value={jobRequest.description}
              onChange={(e) =>
                handleJobRequestFormFieldChange('description', e.target.value)
              }
            />
          </FormControl>
        </Box>
        <Box
          sx={{
            borderRadius: '10px',
            background: '#fbfbfe',
            px: 2.5,
            py: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <Typography variant="body2" color="primary">
            Funds
          </Typography>
          <Box>
            <Typography variant="caption" color="primary" sx={{ mb: 1 }}>
              Token
            </Typography>
            <RoundedBox sx={{ p: 2 }}>
              <Typography variant="body2" fontWeight={500} color="primary">
                {ESCROW_NETWORKS[jobRequest.chainId as ChainId]?.hmtAddress}
              </Typography>
            </RoundedBox>
          </Box>
          <FormControl>
            <TextField
              placeholder="Amount"
              value={jobRequest.fundAmount}
              onChange={(e) =>
                handleJobRequestFormFieldChange('fundAmount', e.target.value)
              }
            />
          </FormControl>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 8 }}>
        <Button
          variant="outlined"
          sx={{ minWidth: '240px', py: 1 }}
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          variant="contained"
          sx={{ minWidth: '240px', py: 1 }}
          onClick={handleLaunch}
          disabled={isLoading}
        >
          {isLoading && <CircularProgress size={24} sx={{ mr: 1 }} />} Fund and
          Request Job
        </Button>
      </Box>
    </RoundedBox>
  );
};
