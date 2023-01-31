import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { SUPPORTED_CHAIN_IDS, ESCROW_NETWORKS, ChainId } from 'src/constants';
import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { RoundedBox } from './RoundedBox';
import { FortuneJobRequestType, FundingMethodType } from './types';

type JobRequestProps = {
  fundingMethod: FundingMethodType;
  onBack: () => void;
  onLaunch: (data: any) => void;
};

export const JobRequest = ({
  fundingMethod,
  onBack,
  onLaunch,
}: JobRequestProps) => {
  const { address } = useAccount();
  const [jobRequest, setJobRequest] = useState<FortuneJobRequestType>({
    chainId: 80001,
    title: '',
    description: '',
    fortunesRequired: 0,
    token: '',
    fundAmount: 0,
    jobRequester: '',
  });

  const handleJobRequestFormFieldChange = (
    fieldName: string,
    fieldValue: any
  ) => {
    setJobRequest({ ...jobRequest, [fieldName]: fieldValue });
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
                  value={jobRequest.fortunesRequired}
                  onChange={(e) =>
                    handleJobRequestFormFieldChange(
                      'fortunesRequired',
                      Number(e.target.value)
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
          {/* <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel>Token</InputLabel>
            <Select label="Token" variant="outlined">
              <MenuItem value={10}>Ten</MenuItem>
              <MenuItem value={20}>Twenty</MenuItem>
              <MenuItem value={30}>Thirty</MenuItem>
            </Select>
          </FormControl> */}
          <FormControl>
            <TextField
              placeholder="Amount"
              value={jobRequest.fundAmount}
              onChange={(e) =>
                handleJobRequestFormFieldChange(
                  'fundAmount',
                  Number(e.target.value)
                )
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
          onClick={() =>
            onLaunch({
              ...jobRequest,
              jobRequester: address,
              token: ESCROW_NETWORKS[jobRequest.chainId as ChainId]?.hmtAddress,
            })
          }
        >
          Fund and Request Job
        </Button>
      </Box>
    </RoundedBox>
  );
};
