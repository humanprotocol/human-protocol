import { Typography } from '@mui/material';
import numeral from 'numeral';
import React from 'react';

import { CardContainer } from '../Container';

type CardTextBlockProps = {
  title: string;
  value?: number | string;
  format?: string;
};

export const CardTextBlock: React.FC<CardTextBlockProps> = ({
  title,
  value,
  format = '0,0',
}): React.ReactElement => {
  return (
    <CardContainer>
      <Typography variant="body2" color="primary" fontWeight={600} mb="4px">
        {title}
      </Typography>
      <Typography
        variant="h2"
        color="primary"
        sx={{ fontSize: { xs: 32, md: 48, lg: 64, xl: 80 } }}
      >
        {numeral(value).format(format)}
      </Typography>
    </CardContainer>
  );
};
