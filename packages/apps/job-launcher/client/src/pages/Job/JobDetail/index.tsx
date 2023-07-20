import { Box, Card, Grid, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';
import { CardTextRow } from '../../../components/CardTextRow';
import { CopyAddressButton } from '../../../components/CopyAddressButton';
import { SearchField } from '../../../components/SearchField';

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
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }} mb={6}>
        <Typography variant="h4" fontWeight={600}>
          Job details
        </Typography>
        <CopyAddressButton
          address={'0xF0245F6251Bef9447A08766b9DA2B07b28aD80B0'}
          ml={6}
        />
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
              <CardTextRow
                label="Manifest URL"
                value="https://job-laucher.ai"
              />
              <CardTextRow
                label="Manifest Hash"
                value="0xe22647d4ae522f7545e7b4dda8c96772aefbfcdb1c5eae9d1025efdc "
              />
              <CardTextRow label="Balance of" value="2,000 HMT" />
              <CardTextRow label="Paid Out HMT" value="390 HMT" />
              <CardTextRow label="Amount of Jobs" value="200" />
              <CardTextRow label="Workers assigned" value="10" />
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
              <CardTextRow
                label="Staker"
                value="0xe22647d4ae522f7545e7b4dda8c96772aefbfcdb1c5eae9d1025efdc"
              />
              <CardTextRow label="Staked HMT" value="2,000 HMT" />
              <CardTextRow label="Slashed HMT" value="0 HMT" />
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
                  <CardTextRow label="Chain Id" value="80001" />
                  <CardTextRow label="Title" value="Title here" />
                  <CardTextRow
                    label="Description"
                    value="Lorem Ipsum Dolor Sit Amet"
                  />
                  <CardTextRow label="Fortune's request" value="2 Submit" />
                  <CardTextRow
                    label="Token"
                    value="0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4"
                  />
                  <CardTextRow label="Fund Amount" value="1 HMT" />
                  <CardTextRow
                    label="Job Requester"
                    value="0x670 bCc966ddc4fE7136c8793617a2C4D22849827"
                  />
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <CardTextRow
                    label="Recording Oracle"
                    value="0x670bCc966ddc4fE7136c8793617a2C4D22849827"
                  />
                  <CardTextRow
                    label="Reputation Oracle"
                    value="0x6aC0881d52B08a9FF766b9Ac51FD9F488D761d98 "
                  />
                  <CardTextRow
                    label="Exchange Oracle"
                    value="0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec"
                  />
                  <CardTextRow label="Recording URL" value="https://rec.url" />
                  <CardTextRow label="Reputation URL" value="https://rep.url" />
                  <CardTextRow label="Exchange URL" value="https://exc.url" />
                </Stack>
              </Grid>
            </Grid>
          </CardContainer>
        </Grid>
      </Grid>
    </Box>
  );
}
