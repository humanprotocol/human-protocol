import { FC } from 'react';
import { Box, Typography, useTheme } from '@mui/material';

import PageWrapper from '../../components/PageWrapper';
import KVStoreTable from '../../components/Tables/kvstore';
import { KVStoreIcon } from '../../icons';

const KVStore: FC = () => {
  const theme = useTheme();

  return (
    <PageWrapper>
      <Box
        paddingX={{ xs: 2, md: 8 }}
        pt={3}
        pb={8}
        bgcolor="#f6f7fe"
        borderRadius="20px"
        minHeight="calc(100dvh - 210px)"
      >
        <Box display="flex" alignItems="center" gap={2} mb={4}>
          <KVStoreIcon sx={{ width: 66, height: 66 }} />
          <Typography
            variant="h1"
            fontSize={28}
            color={theme.palette.primary.main}
          >
            KV Store
          </Typography>
        </Box>
        <KVStoreTable />
      </Box>
    </PageWrapper>
  );
};

export default KVStore;
