import { Box, Typography } from '@mui/material';
import numeral from 'numeral';
import React, { ReactElement } from 'react';

import { CardContainer } from '../Container';

type CardTextBlockProps = {
  title: string | ReactElement;
  value?: number | string;
  format?: string;
  changes?: number;
};

export default function CardTextBlock({
  title,
  value,
  format = '0,0',
  changes,
}: CardTextBlockProps): React.ReactElement {
  return (
    <CardContainer>
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
    </CardContainer>
  );
}
