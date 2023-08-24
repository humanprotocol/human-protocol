import { Box, Typography } from '@mui/material';
import numeral from 'numeral';
import { FC, ReactElement } from 'react';

import { Container } from '../Container';
import { TooltipIcon } from 'src/components/TooltipIcon';

type TextBlockProps = {
  title: string | ReactElement;
  value?: number | string;
  component?: ReactElement;
  format?: string;
  changes?: number;
};

export const TextBlock: FC<TextBlockProps> = ({
  title,
  value,
  component,
  format = '0,0',
  changes,
}) => {
  return (
    <Container>
      <Typography variant="body2" color="primary" fontWeight={600}>
        {title}
      </Typography>
      <Box display="flex" alignItems="baseline" overflow="hidden">
        {component ? (
          component
        ) : (
          <Typography
            variant="h2"
            color="primary"
            lineHeight={1.2}
            marginTop={{ xs: '4px', md: 2 }}
            sx={{ fontSize: { xs: 40, xl: 60 } }}
          >
            {Number.isNaN(Number(value))
              ? value
              : numeral(value).format(format)}
          </Typography>
        )}

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
      <TooltipIcon
        position="topRight"
        title="Sorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus. Sed dignissim."
      />
    </Container>
  );
};
