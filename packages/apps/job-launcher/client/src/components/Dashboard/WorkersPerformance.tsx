import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

const StyledBox = styled(Box)`
  border-radius: 8px;
  background: #f9faff;
  padding: 18px;
  padding-top: 13px;
  padding-bottom: 15px;
  height: 100%;
  box-sizing: border-box;
`;

export const WorkersPerformance = () => {
  return (
    <Card sx={{ height: '100%', boxSizing: 'border-box' }}>
      <CardContent>
        <Typography fontWeight={500} mb={3}>
          Workers performance (average)
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <StyledBox>
              <Typography variant="h4" fontWeight={600} mb={4}>
                8/10
              </Typography>
              <Typography fontSize={10} fontWeight={500} lineHeight="14px">
                Reputation
              </Typography>
            </StyledBox>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StyledBox>
              <Typography variant="h4" fontWeight={600} mb={4}>
                48h
              </Typography>
              <Typography fontSize={10} fontWeight={500} lineHeight="14px">
                Time to complete
              </Typography>
            </StyledBox>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StyledBox>
              <Typography variant="h4" fontWeight={600} mb={4}>
                8/10
              </Typography>
              <Typography fontSize={10} fontWeight={500} lineHeight="14px">
                Accuracy of completion
              </Typography>
            </StyledBox>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
