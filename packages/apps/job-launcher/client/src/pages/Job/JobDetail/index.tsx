import { Box, Card, Grid, IconButton, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';
import { useParams } from 'react-router-dom';
import { CardTextRow } from '../../../components/CardTextRow';
import { CopyAddressButton } from '../../../components/CopyAddressButton';
import { CopyLinkIcon } from '../../../components/Icons/CopyLinkIcon';
import { SearchField } from '../../../components/SearchField';
import { Table } from '../../../components/Table';
import { useJob } from '../../../hooks/useJob';
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
  const { chainId, address } = useParams();
  const { data, isLoading } = useJob({ chainId, address });

  if (!data || isLoading) return <>Loading...</>;

  return (
    <Box>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }} mb={6}>
          <Typography variant="h4" fontWeight={600}>
            Job details
          </Typography>
          <CopyAddressButton address={data?.address} ml={6} />
          <Box sx={{ ml: 'auto' }}>
            <SearchField />
          </Box>
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
                <CardTextRow label="Manifest URL" value={data.manifestUrl} />
                <CardTextRow label="Manifest Hash" value={data.manifestHash} />
                <CardTextRow
                  label="Balance of"
                  value={`${formatAmount(data.balance)} HMT`}
                />
                <CardTextRow
                  label="Paid Out HMT"
                  value={`${formatAmount(data.amountPaid)} HMT`}
                />
                <CardTextRow label="Amount of Jobs" value={data.count} />
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
                <CardTextRow label="Staker" value="" />
                <CardTextRow label="Staked HMT" value="" />
                <CardTextRow label="Slashed HMT" value="" />
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
                    <CardTextRow label="Chain Id" value={chainId} />
                    <CardTextRow label="Title" value="" />
                    <CardTextRow label="Description" value="" />
                    <CardTextRow label="Fortune's request" value="" />
                    <CardTextRow label="Token" value={data.token} />
                    <CardTextRow
                      label="Fund Amount"
                      value={`${formatAmount(data.totalFundedAmount)} HMT`}
                    />
                    <CardTextRow label="Job Requester" value={data.launcher} />
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <CardTextRow
                      label="Recording Oracle"
                      value={data.recordingOracle}
                    />
                    <CardTextRow
                      label="Reputation Oracle"
                      value={data.reputationOracle}
                    />
                    <CardTextRow label="Exchange Oracle" value="" />
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
      </Box>
    </Box>
  );
}
