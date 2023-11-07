import {
  Box,
  FormControl,
  Grid,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';
import { CardContainer } from '../Cards';
import { ViewTitle } from '../ViewTitle';
import userSvg from 'src/assets/user.svg';

const TaskSelectFormControl = styled(FormControl)({
  borderRadius: '10px',
  background: 'rgba(20, 6, 178, 0.04)',
  padding: '22px',
  boxSizing: 'border-box',
});

export const LaunchTaskView = () => {
  return (
    <Box mt={10}>
      <ViewTitle title="Launch task" iconUrl={userSvg} />
      <CardContainer sxProps={{ border: '2px solid #ECEBF9', mt: 8 }}>
        <Typography color="primary" variant="h4" fontWeight={600} mb={2}>
          Launch task: what is your task about?
        </Typography>
        <Typography variant="h6" fontWeight={500} color="#5E69A6">
          Choose your data annotation task type from the types available below
        </Typography>
        <Box maxWidth="984px" mx="auto" p={4}>
          <Grid container spacing={4}>
            <Grid item xs={12} sm={12} md={6}>
              <TaskSelectFormControl variant="standard" fullWidth>
                <Select
                  displayEmpty
                  renderValue={(selected: any) => selected ?? 'Text labeling'}
                >
                  <MenuItem value={10}>Text free entry/OCR</MenuItem>
                  <MenuItem value={20}>Multiple Choice</MenuItem>
                </Select>
              </TaskSelectFormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <TaskSelectFormControl variant="standard" fullWidth>
                <Select
                  displayEmpty
                  renderValue={(selected: any) => selected ?? 'Image labeling'}
                >
                  <MenuItem value={10}>Binary</MenuItem>
                  <MenuItem value={20}>Bounding box</MenuItem>
                  <MenuItem value={20}>Redo BB</MenuItem>
                  <MenuItem value={20}>Multiple Choice</MenuItem>
                  <MenuItem value={20}>Semantic segmentation</MenuItem>
                </Select>
              </TaskSelectFormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <TaskSelectFormControl variant="standard" fullWidth>
                <Select
                  displayEmpty
                  renderValue={(selected: any) => selected ?? 'Market making'}
                >
                  <MenuItem value={10}>HuFi</MenuItem>
                </Select>
              </TaskSelectFormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <TaskSelectFormControl variant="standard" fullWidth>
                <Select
                  displayEmpty
                  renderValue={(selected: any) => selected ?? 'Open queries'}
                >
                  <MenuItem value={10}>Text free entry/OCR</MenuItem>
                  <MenuItem value={20}>Multiple Choice</MenuItem>
                </Select>
              </TaskSelectFormControl>
            </Grid>
          </Grid>
        </Box>
      </CardContainer>
    </Box>
  );
};
