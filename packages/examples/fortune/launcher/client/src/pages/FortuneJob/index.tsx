import {
  Box,
  Button,
  Grid,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React from 'react';
import { useParams } from 'react-router-dom';
import escrowSvg from 'src/assets/escrow.svg';
import fortuneImg from 'src/assets/fortune.png';
import { CardContainer, CardTextRow, CopyAddressButton } from 'src/components';

export default function FortuneJobPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const { chainId, address } = useParams();

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
        <Box display="flex" alignItems="center" flexWrap="wrap">
          <Box display="flex" alignItems="center">
            <Box
              sx={{
                display: 'flex',
                position: 'relative',
                height: { xs: '48px', md: '85px' },
                width: { xs: '48px', md: '85px' },
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: { xs: '48px', md: '85px' },
                  width: { xs: '48px', md: '85px' },
                  borderRadius: '100%',
                  background:
                    'linear-gradient(12.79deg, #F7F8FD 20.33%, #FFFFFF 48.75%)',
                  boxShadow: '0px 24px 32px rgba(12, 32, 213, 0.06)',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: { xs: '48px', md: '85px' },
                  width: { xs: '48px', md: '85px' },
                  borderRadius: '100%',
                  background:
                    'radial-gradient(83.8% 83.8% at 50% 16.2%, #F0F0FF 0%, #F1F1FD 0%, #FFFFFF 70.31%);',
                  boxShadow: '0px 24px 32px rgba(12, 32, 213, 0.06)',
                }}
              />
              <img
                src={escrowSvg}
                alt="escrow"
                style={{ zIndex: 100, width: '50%' }}
              />
            </Box>
            <Typography variant="h4" color="primary" ml={{ xs: 2, sm: 4 }}>
              Escrow
            </Typography>
          </Box>
          {!isMobile && <CopyAddressButton address={address || ''} ml={6} />}
        </Box>
        {isMobile && (
          <Box mt={{ xs: 4, md: 6 }}>
            <CopyAddressButton address={address || ''} />
          </Box>
        )}
        <Grid container spacing={4} mt={{ xs: 0, md: 4 }}>
          <Grid item xs={12}>
            <CardContainer densed>
              <Box
                sx={{
                  background: '#f9faff',
                  borderRadius: '8px',
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 3,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                >
                  <img
                    src={fortuneImg}
                    alt="fortune"
                    style={{ width: 36, height: '100%' }}
                  />
                  This is a Fortune Request with pending jobs, anyone can
                  submit.
                </Typography>
                <Button variant="contained">Connect Wallet to Submit</Button>
              </Box>
              <Grid container spacing={2} mb={3}>
                <Grid
                  item
                  xs={12}
                  md={6}
                  sx={{ background: '#f9faff', borderRadius: '8px', p: 3 }}
                >
                  <Box sx={{ p: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{ display: 'flex', alignItems: 'center', gap: 3 }}
                    >
                      <img
                        src={fortuneImg}
                        alt="fortune"
                        style={{ width: 36, height: '100%' }}
                      />
                      Fortune Submission
                    </Typography>
                    <Stack spacing={2}>
                      <CardTextRow label="Title" value="Title Here" />
                      <CardTextRow
                        label="Description"
                        value="Lorem Ipsum Dolor Sit Amet"
                      />
                      <CardTextRow label="Fortunes Required" value="2" />
                      <CardTextRow
                        label="Exchagne Address"
                        value="0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4"
                      />
                      <CardTextRow label="Status" value="Status" />
                      <CardTextRow label="Balance" value="1" />
                    </Stack>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      height: '100%',
                      px: 4,
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      flexDirection: 'column',
                    }}
                  >
                    <Typography
                      sx={{
                        border: '3px solid #320a8d',
                        borderRadius: '8px',
                        px: 1.5,
                        py: 2,
                        width: '100%',
                        mb: 4.5,
                      }}
                    >
                      Fortune 1 text here
                    </Typography>
                    <Button variant="contained">Submit Fortune</Button>
                  </Box>
                </Grid>
              </Grid>
              <Typography
                variant="body2"
                color="primary"
                fontWeight={600}
                sx={{ mb: 2 }}
              >
                Job Manifest
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <CardTextRow label="Chain id" value="80001" />
                    <CardTextRow label="Title" value="Title Here" />
                    <CardTextRow
                      label="Description"
                      value="Lorem Ipsum Dolor Sit Amet"
                    />
                    <CardTextRow label="Fortunes Required" value="2" />
                    <CardTextRow
                      label="Token"
                      value="0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4"
                    />
                    <CardTextRow label="Fund Amount" value="1 HMT" />
                    <CardTextRow
                      label="Job Requester"
                      value="0x670bCc966ddc4fE7136c8793617a2C4D22849827"
                    />
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <CardTextRow
                      label="Manifest Hash"
                      value="0xe22647d4ae522f7545e7b4dda8c96772aefbfcdb1c5eae9d1025efdc"
                    />
                    <CardTextRow label="Balance of" value="2,000 HMT" />
                    <CardTextRow label="Paid Out HMT" value="390 HMT" />
                    <CardTextRow label="Amount of Jobs" value="200" />
                    <CardTextRow label="Workers assigned" value="10" />
                  </Stack>
                </Grid>
              </Grid>
            </CardContainer>
          </Grid>
          <Grid item xs={12} md={6}>
            <CardContainer densed>
              <Typography
                variant="body2"
                color="primary"
                fontWeight={600}
                sx={{ mb: 2 }}
              >
                Escrow details
              </Typography>
              <Stack spacing={2}>
                <CardTextRow
                  label="Recording Oracle"
                  value="0x670bCc966ddc4fE7136c8793617a2C4D22849827"
                />
                <CardTextRow
                  label="Reputation Oracle"
                  value="0x6aC0881d52B08a9FF766b9Ac51FD9F488D761d98"
                />
                <CardTextRow
                  label="Exchange Oracle"
                  value="0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec"
                />
                <CardTextRow label="Recording URL" value="https://rec.url" />
                <CardTextRow label="Reputation URL" value="https://rep.url" />
                <CardTextRow label="Exchange URL" value="https://exc.url" />
              </Stack>
            </CardContainer>
          </Grid>
          <Grid item xs={12} md={6}>
            <CardContainer densed>
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
        </Grid>
      </Box>
    </Box>
  );
}
