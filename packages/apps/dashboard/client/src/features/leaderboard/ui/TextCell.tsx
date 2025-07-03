import { FC } from 'react';

import Typography from '@mui/material/Typography';

type TextCellProps = {
  value: string;
};

const TextCell: FC<TextCellProps> = ({ value }) => (
  <Typography
    height="100%"
    variant="body1"
    alignItems="center"
    display="flex"
    justifyContent="flex-start"
    fontWeight={500}
  >
    {value}
  </Typography>
);

export default TextCell;
