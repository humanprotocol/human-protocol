import type { FC, PropsWithChildren } from 'react';

import Card from '@mui/material/Card';

const SectionWrapper: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        px: { xs: 2, md: 8 },
        py: { xs: 4, md: 4 },
        mb: 4,
        borderRadius: '16px',
        boxShadow: 'none',
      }}
    >
      {children}
    </Card>
  );
};

export default SectionWrapper;
