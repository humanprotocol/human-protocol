import { Stack, Typography } from '@mui/material';
import { FC } from 'react';
import { Link } from 'react-router-dom';

type CardTextRowProps = {
  label?: string;
  value?: string | number;
  minWidth?: number;
  url?: string;
};

export const CardTextRow: FC<CardTextRowProps> = ({
  label,
  value,
  minWidth = 130,
  url,
}) => {
  return (
    <Stack direction="row" spacing={3}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth }}>
        {label ? `${label} :` : ''}
      </Typography>
      <Typography
        variant="body2"
        color="primary"
        sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {url ? (
          <Link
            style={{
              textDecoration: 'underline',
              alignItems: 'left',
            }}
            to={url}
          >
            {value}
          </Link>
        ) : (
          value
        )}
      </Typography>
    </Stack>
  );
};
