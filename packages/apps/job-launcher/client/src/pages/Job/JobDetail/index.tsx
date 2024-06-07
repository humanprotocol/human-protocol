import { LoadingButton } from '@mui/lab';
import { Box, Card, Grid, IconButton, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CardTextRow } from '../../../components/CardTextRow';
import { CopyAddressButton } from '../../../components/CopyAddressButton';
import { CopyLinkIcon } from '../../../components/Icons/CopyLinkIcon';
import { Table } from '../../../components/Table';
import { useJobDetails } from '../../../hooks/useJobDetails';
import { useSnackbar } from '../../../providers/SnackProvider';
import * as jobService from '../../../services/job';
import { JobStatus } from '../../../types';

const CardContainer = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  background: '#fff',
  boxShadow:
    '0px 1px 5px 0px rgba(233, 235, 250, 0.20), 0px 2px 2px 0px rgba(233, 235, 250, 0.50), 0px 3px 1px -2px #E9EBFA',
  padding: '24px 40px 36px',
  height: '100%',
  boxSizing: 'border-box',
}));

export default function JobDetail() {
  const { jobId } = useParams();
  const { data, isLoading, error, mutate } = useJobDetails(Number(jobId));
  const [isCancelling, setIsCancelling] = useState(false);
  const { openSnackbar, showError } = useSnackbar();

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await jobService.cancelJob(Number(jobId));

      if (data) {
        mutate({
          ...data,
          details: { ...data.details, status: JobStatus.TO_CANCEL },
        });
      }
      openSnackbar('Job canceled', 'success');
    } catch (err: any) {
      showError(err);
    }
    setIsCancelling(false);
  };

  const isCancellable =
    data?.details.status === JobStatus.FAILED ||
    data?.details.status === JobStatus.PAID ||
    data?.details.status === JobStatus.PENDING ||
    data?.details.status === JobStatus.PARTIAL ||
    data?.details.status === JobStatus.SET_UP ||
    data?.details.status === JobStatus.CREATED ||
    data?.details.status === JobStatus.LAUNCHED;

  if (isLoading) return <>Loading...</>;

  if (!data || error) return <>Failed to fetch job details. Try again later.</>;

  return (
    <Box>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }} mb={6}>
          <Typography variant="h4" fontWeight={600}>
            Job details
          </Typography>
          <CopyAddressButton address={data.details.escrowAddress} ml={6} />
        </Box>
        {isCancellable && (
          <LoadingButton
            sx={{ mb: 2 }}
            variant="contained"
            color="primary"
            loading={isCancelling}
            onClick={handleCancel}
          >
            Cancel
          </LoadingButton>
        )}
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <CardContainer>
              <Typography
                variant="body2"
                color="primary"
                fontWeight={600}
                sx={{ mb: 2 }}
              >
                Job details
              </Typography>
              <Stack spacing={2}>
                <CardTextRow
                  label="Manifest URL"
                  value={data.details.manifestUrl}
                />
                <CardTextRow
                  label="Manifest Hash"
                  value={data.details.manifestHash}
                />
                <CardTextRow
                  label="Balance of"
                  value={`${data.details.balance} HMT`}
                />
                <CardTextRow
                  label="Paid Out HMT"
                  value={`${data.details.paidOut.toString()} HMT`}
                />
                <CardTextRow label="Amount of Jobs" value="" />
                <CardTextRow label="Workers assigned" value="" />
              </Stack>
            </CardContainer>
          </Grid>
          <Grid item xs={12} md={6}>
            <CardContainer>
              <Typography
                variant="body2"
                color="primary"
                fontWeight={600}
                sx={{ mb: 2 }}
              >
                Stake details
              </Typography>
              <Stack spacing={2}>
                <CardTextRow label="Staker" value={data.staking.staker} />
                <CardTextRow
                  label="Staked HMT"
                  value={`${data.staking.allocated.toString()} HMT`}
                />
                <CardTextRow
                  label="Slashed HMT"
                  value={`${data.staking.slashed.toString()} HMT`}
                />
              </Stack>
            </CardContainer>
          </Grid>
          <Grid item xs={12}>
            <CardContainer>
              <Typography
                variant="body2"
                color="primary"
                fontWeight={600}
                sx={{ mb: 2 }}
              >
                Job Manifest
              </Typography>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <CardTextRow
                      label="Chain Id"
                      value={data.manifest.chainId}
                    />
                    <CardTextRow label="Title" value={data.manifest.title} />
                    <CardTextRow
                      label="Description"
                      value={data.manifest.description}
                    />
                    <CardTextRow
                      label="Fortune's request"
                      value={data.manifest.submissionsRequired}
                    />
                    <CardTextRow
                      label="Token"
                      value={data.manifest.tokenAddress}
                    />
                    <CardTextRow
                      label="Fund Amount"
                      value={`${data.manifest.fundAmount.toString()} HMT`}
                    />
                    <CardTextRow
                      label="Job Requester"
                      value={data.manifest.requesterAddress}
                    />
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <CardTextRow
                      label="Recording Oracle"
                      value={data.manifest.recordingOracleAddress}
                    />
                    <CardTextRow
                      label="Reputation Oracle"
                      value={data.manifest.reputationOracleAddress}
                    />
                    <CardTextRow
                      label="Exchange Oracle"
                      value={data.manifest.exchangeOracleAddress}
                    />
                    <CardTextRow label="Recording URL" value="" />
                    <CardTextRow label="Reputation URL" value="" />
                    <CardTextRow label="Exchange URL" value="" />
                  </Stack>
                </Grid>
              </Grid>
            </CardContainer>
          </Grid>
        </Grid>
      </Box>
      {data.results && (
        <Box sx={{ mt: 10 }}>
          <Typography variant="h4" fontWeight={600}>
            Job solutions
          </Typography>
          <Box sx={{ mt: 7 }}>
            {data.manifest.requestType === 'FORTUNE' && (
              <Table
                columns={[
                  {
                    id: 'workerAddress',
                    label: 'Worker Address',
                    render: ({ workerAddress }) => (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {workerAddress}
                        <IconButton color="primary" sx={{ ml: 3 }}>
                          <CopyLinkIcon />
                        </IconButton>
                      </Box>
                    ),
                  },
                  { id: 'solution', label: 'Fortune' },
                  {
                    id: 'error',
                    label: 'Status',
                    render: ({ error }) => (error ? 'Refused' : 'Accepted'),
                  },
                  { id: 'error', label: 'Refused reason' },
                ]}
                data={data.results}
              />
            )}
            {data.manifest.requestType !== 'FORTUNE' && (
              <Box
                sx={{
                  borderRadius: '16px',
                  background: '#fff',
                  boxShadow:
                    '0px 1px 5px 0px rgba(233, 235, 250, 0.20), 0px 2px 2px 0px rgba(233, 235, 250, 0.50), 0px 3px 1px -2px #E9EBFA',
                  p: '14px 42px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Stack direction="row" spacing={3}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ minWidth: 130 }}
                  >
                    URL :
                  </Typography>
                  <Typography
                    variant="body2"
                    color="primary"
                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    <Link
                      style={{
                        textDecoration: 'underline',
                        alignItems: 'left',
                      }}
                      to={data.results as string}
                    >
                      {data.results as string}
                    </Link>
                  </Typography>
                </Stack>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
