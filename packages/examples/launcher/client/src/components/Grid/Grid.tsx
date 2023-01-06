import { TableContainer, Box, Table } from '@mui/material';
import * as React from 'react';
import { styled } from '@mui/material/styles';

const TableStyle = styled(Table)(({ theme }: any) => ({
  minWidth: 500,
  // overflowX: 'auto',
  '& .statusText': {
    padding: '2px 4px',
    borderRadius: theme.spacing(0.75),
    color: theme.palette.common.white,
  },
  '& .activeText': {
    backgroundColor: theme.palette.info.main,
  },
}));
export const TableStyleContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <TableContainer>
      <TableStyle>{children}</TableStyle>
    </TableContainer>
  );
};

export const BoxShadowContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <Box
      sx={{
        boxShadow: { sm: '0 0 5px #ddd' },
        borderRadius: '15px',
        py: '6rem',
        px: '1rem',
      }}
    >
      <Box>{children}</Box>
    </Box>
  );
};

export const BoxContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <Box>
      <Box>{children}</Box>
    </Box>
  );
};
