import { FC } from 'react';
import PageWrapper from '../../components/PageWrapper';
import { Box, Container } from '@mui/material';
import KVStoreTable from 'src/components/Tables/kvstore';
import { KVStoreIcon } from 'src/icons';

const KVStore: FC = () => {
  return (
    <PageWrapper>
      <Container maxWidth={false}>
        <Box mt={8}>
          <KVStoreIcon sx={{ width: 66, height: 66 }} />
          <KVStoreTable />
        </Box>
      </Container>
    </PageWrapper>
  );
};

export default KVStore;
