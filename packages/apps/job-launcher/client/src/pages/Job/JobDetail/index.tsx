import { Box, Card, Grid, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';
import { useParams } from 'react-router-dom';
import { CardTextRow } from '../../../components/CardTextRow';
import { CopyAddressButton } from '../../../components/CopyAddressButton';
import { useJobDetails } from '../../../hooks/useJobDetails';
import { formatAmount } from '../../../utils/bignumber';

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
  const { data, isLoading, error } = useJobDetails(Number(jobId));

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
                  value={`${data.details.balance.toFixed(2)} HMT`}
                />
                <CardTextRow
                  label="Paid Out HMT"
                  value={`${formatAmount(data.details.paidOut.toString())} HMT`}
                />
                <CardTextRow
                  label="Amount of Jobs"
                  value={data.details.amountOfTasks}
                />
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
                  value={`${formatAmount(
                    data.staking.allocated.toString()
                  )} HMT`}
                />
                <CardTextRow
                  label="Slashed HMT"
                  value={`${formatAmount(data.staking.slashed.toString())} HMT`}
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
                      value={`${formatAmount(
                        data.manifest.fundAmount.toString()
                      )} HMT`}
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
      {/*
      TODO: Add this back in when we have a way to fetch the job solution
      <Box sx={{ mt: 10 }}>
        <Typography variant="h4" fontWeight={600}>
          Job solutions
        </Typography>
        <Box sx={{ mt: 7 }}>
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
              { id: 'fortune', label: 'Fortune' },
            ]}
            data={[
              {
                workerAddress: '0x670bCc966ddc4fE7136c8793617a2C4D22849827',
                fortune: '1',
              },
              {
                workerAddress: '0x670bCc966ddc4fE7136c8793617a2C4D22849827',
                fortune: '1',
              },
              {
                workerAddress: '0x670bCc966ddc4fE7136c8793617a2C4D22849827',
                fortune: '1',
              },
              {
                workerAddress: '0x670bCc966ddc4fE7136c8793617a2C4D22849827',
                fortune: '1',
              },
            ]}
          />
        </Box>
      </Box> */}
    </Box>
  );
}
