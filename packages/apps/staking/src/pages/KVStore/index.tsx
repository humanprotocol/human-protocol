import { FC } from 'react';
import { Box, Typography, useTheme } from '@mui/material';

import PageWrapper from '../../components/PageWrapper';
import KVStoreTable from '../../components/Tables/kvstore';
import { DarkKvstoreIcon, KVStoreIcon } from '../../icons';

const KVStore: FC = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <PageWrapper>
      <Box
        px={{ xs: 2, md: 8 }}
        pt={3}
        pb={8}
        mx={{ xs: -3, sm: 0 }}
        borderRadius={{ xs: 0, sm: '20px' }}
        minHeight="calc(100dvh - 212px)"
        sx={{
          background: isDarkMode
            ? theme.palette.elevation.light
            : theme.palette.background.grey,
        }}
      >
        <Box display="flex" alignItems="center" gap={2} mb={4}>
          {isDarkMode ? (
            <DarkKvstoreIcon sx={{ width: 66, height: 66 }} />
          ) : (
            <KVStoreIcon sx={{ width: 66, height: 66 }} />
          )}
          <Typography variant="h1" fontSize={28}>
            KV Store
          </Typography>
        </Box>
        <KVStoreTable />
      </Box>
    </PageWrapper>
  );
};

export default KVStore;
