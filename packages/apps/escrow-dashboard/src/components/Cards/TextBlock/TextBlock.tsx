import { Box, Typography } from '@mui/material';
import numeral from 'numeral';
import { FC, ReactElement } from 'react';

import { Container } from '../Container';

type TextBlockProps = {
  title: string | ReactElement;
  value?: number | string;
  format?: string;
  changes?: number;
};

export const TextBlock: FC<TextBlockProps> = ({
  title,
  value,
  format = '0,0',
  changes,
}) => {
  return (
    <Container>
      <Typography variant="body2" color="primary" fontWeight={600} mb="4px">
        {title}
      </Typography>
      <Box display="flex" alignItems="baseline">
        <Typography
          variant="h2"
          color="primary"
          sx={{ fontSize: { xs: 32, md: 48, lg: 64, xl: 80 } }}
        >
          {Number.isNaN(value) ? value : numeral(value).format(format)}
        </Typography>
        {changes === undefined ? (
          <></>
        ) : changes >= 0 ? (
          <Typography variant="caption" color="success.light" ml="4px">
            (+{Math.abs(changes).toFixed(2)}%)
          </Typography>
        ) : (
          <Typography variant="caption" color="error.light" ml="4px">
            (-{Math.abs(changes).toFixed(2)}%)
          </Typography>
        )}
      </Box>
    </Container>
  );
};
