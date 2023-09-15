import { Box, Card, CardContent, Typography } from '@mui/material';
import React from 'react';

import { ErrorIcon } from '../Icons/ErrorIcon';
import { SuccessIcon } from '../Icons/SuccessIcon';
import { WarningIcon } from '../Icons/WarningIcon';

export const OracleReputation = () => {
  return (
    <Card>
      <CardContent>
        <Typography fontWeight={500} mb={3}>
          Oracle reputation
        </Typography>
        <Box
          sx={{
            borderRadius: '8px',
            background: '#f9faff',
            px: '35px',
            pt: '10px',
            pb: '18px',
          }}
        >
          <Typography
            fontSize={48}
            lineHeight={1.5}
            fontWeight={600}
            color="success.main"
            mb={2}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <SuccessIcon sx={{ fontSize: '48px', mr: '20px' }} />
            High
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Typography
              fontSize={10}
              fontWeight={500}
              color="success.main"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <SuccessIcon sx={{ mr: 1 }} />
              High
            </Typography>
            <Typography
              fontSize={10}
              fontWeight={500}
              color="warning.main"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <WarningIcon sx={{ mr: 1 }} />
              Medium
            </Typography>
            <Typography
              fontSize={10}
              fontWeight={500}
              color="error.main"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <ErrorIcon sx={{ mr: 1 }} />
              Low
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
