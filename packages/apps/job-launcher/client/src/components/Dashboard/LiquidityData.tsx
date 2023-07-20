import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

const StyledBox = styled(Box)`
  border-radius: 8px;
  background: #f9faff;
  padding: 28px;
  padding-top: 14px;
  padding-bottom: 18px;
  height: 100%;
  box-sizing: border-box;
`;

export const LiquidityData = () => {
  return (
    <Card>
      <CardContent>
        <Typography fontWeight={500} mb={3}>
          Liquidity data
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <StyledBox>
              <Typography variant="h4" fontWeight={600} mb={4}>
                48h
              </Typography>
              <Typography fontSize={10} fontWeight={500} lineHeight="14px">
                Average time to complete a job
              </Typography>
            </StyledBox>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StyledBox>
              <Typography variant="h4" fontWeight={600} mb={4}>
                8/10
              </Typography>
              <Typography fontSize={10} fontWeight={500} lineHeight="14px">
                Performance Accuracy
              </Typography>
            </StyledBox>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box
              sx={{
                borderRadius: '8px',
                border: '1px solid #CBCFE6',
                height: '100%',
                boxSizing: 'border-box',
                padding: '28px',
                paddingTop: '14px',
                paddingBottom: '18px',
              }}
            >
              <Typography color="success.main">5 MINIMUM</Typography>
              <Typography color="warning.main">10 AVERAGE</Typography>
              <Typography color="error.main" sx={{ mb: 1 }}>
                15 MAXIMUM
              </Typography>
              <Typography fontSize={10} fontWeight={500} lineHeight="14px">
                Job cost range
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StyledBox>
              <Typography variant="h4" fontWeight={600} mb={4}>
                30,456
              </Typography>
              <Typography fontSize={10} fontWeight={500} lineHeight="14px">
                Jobs
              </Typography>
            </StyledBox>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
