import { FC, PropsWithChildren } from 'react';

import { Box } from '@mui/material';

import Container from '../Container';
import DefaultHeader from '../Header';
import Footer from '../Footer';

const PageWrapper: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Box minHeight="100dvh">
      <DefaultHeader />
      <Container component="main">{children}</Container>
      <Footer />
    </Box>
  );
};

export default PageWrapper;
