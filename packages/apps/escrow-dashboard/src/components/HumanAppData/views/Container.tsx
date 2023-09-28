import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import React from 'react';

import { HumanAppDataChart } from '../chart';

type ChartContainerProps = {
  data: any;
  title: string;
  items: Array<{ label: string; value: any }>;
  onChange: (value: any) => void;
  children?: React.ReactNode;
};

export const ChartContainer = ({
  data,
  title,
  items,
  onChange,
  children,
}: ChartContainerProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(600));

  if (isMobile) {
    return (
      <Box
        sx={{
          borderRadius: '16px',
          background: '#FFF',
          boxShadow:
            '0px 1px 5px 0px rgba(233, 235, 250, 0.20), 0px 2px 2px 0px rgba(233, 235, 250, 0.50), 0px 3px 1px -2px #E9EBFA;',
          p: 4,
          pb: 8,
          position: 'relative',
        }}
      >
        <Typography fontSize={24} color="primary">
          {title}
        </Typography>
        {data && <HumanAppDataChart data={data} minHeight={250} />}
        {children}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: 'background.paper',
        display: 'flex',
      }}
    >
      <Box
        sx={{
          width: '100%',
          borderRadius: '8px',
          background: '#F6F7FE',
          pt: { xs: 5, md: 10 },
          pb: { xs: 5, md: 7 },
          px: { xs: 2, md: 5 },
          minHeight: 400,
        }}
      >
        {data && (
          <HumanAppDataChart data={data} minHeight={300} minWidth={800} />
        )}
      </Box>
    </Box>
  );
};
