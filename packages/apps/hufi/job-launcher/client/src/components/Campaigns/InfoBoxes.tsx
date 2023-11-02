import { Box, Grid } from '@mui/material';
import React from 'react';

interface InfoBoxesProps {
  data: {
    title: string;
    value: string;
  }[];
  columns: number;
}

export const InfoBoxes: React.FC<InfoBoxesProps> = ({ data, columns }) => {
  return (
    <Grid container spacing={7}>
      {data.map((box, index) => (
        <Grid item xs={12 / columns} key={index}>
          <Box
            sx={{
              height: '144px',
              border: '2px solid #fff',
              borderRadius: '12px',
              padding: '25px',
              background: '#ffffff',
            }}
          >
            <Box sx={{ fontWeight: '600' }}>
              {box.title}
              <br />
            </Box>

            <Box
              sx={{
                fontWeight: '800',
                fontSize: '40px',
                color: 'secondary.light',
              }}
            >
              <br />
              {box.value}
            </Box>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
};
