import { ChainId } from '@human-protocol/sdk';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import React from 'react';
import { NetworkSelect } from '../../../components/NetworkSelect';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';
import { JobType } from '../../../types';
import { AnnotationJobRequestForm } from './AnnotationJobRequestForm';
import { FortuneJobRequestForm } from './FortuneJobRequestForm';

export const CreateJob = () => {
  const { jobRequest, changeJobType, changeNetwork } = useCreateJobPageUI();

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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 5 }}>
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
            onChange={(e) => changeJobType?.(e.target.value as JobType)}
          >
            <MenuItem value={JobType.Fortune}>Fortune</MenuItem>
            <MenuItem value={JobType.Annotation}>Annotation</MenuItem>
          </Select>
        </FormControl>
        <NetworkSelect
          label="Choose Network"
          value={jobRequest.chainId}
          onChange={(e) => changeNetwork?.(e.target.value as ChainId)}
        />
      </Box>
      {jobRequest.jobType === JobType.Fortune && <FortuneJobRequestForm />}
      {jobRequest.jobType === JobType.Annotation && (
        <AnnotationJobRequestForm />
      )}
    </Box>
  );
};
