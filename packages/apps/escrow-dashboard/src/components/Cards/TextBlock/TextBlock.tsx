import { Box, Typography } from '@mui/material';
import numeral from 'numeral';
import { FC, ReactElement } from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';

import { Container } from '../Container';
import { TooltipIcon } from 'src/components/TooltipIcon';

type TextBlockProps = {
  title: string | ReactElement;
  value?: number | string;
  component?: any;
  format?: string;
  changes?: number;
  tooltipTitle?: string;
};

export const TextBlock: FC<TextBlockProps> = ({
  title,
  value,
  component: ValueComponent,
  format = '0,0',
  changes,
  tooltipTitle,
}) => {
  return (
    <Container>
      <Typography variant="body2" color="primary" fontWeight={600}>
        {title}
      </Typography>
      {value === undefined ? (
        <Box
          sx={{ marginTop: { xs: '4px', md: 2 }, height: { xs: 50, md: 72 } }}
        >
          <SkeletonTheme
            baseColor="rgba(0, 0, 0, 0.1)"
            highlightColor="rgba(0, 0, 0, 0.18)"
          >
            <Skeleton count={1} width="100%" height="100%" />
          </SkeletonTheme>
        </Box>
      ) : (
        <Box display="flex" alignItems="baseline" overflow="hidden">
          {ValueComponent ? (
            <ValueComponent value={value} />
          ) : (
            <Typography
              variant="h2"
              color="primary"
              lineHeight={1.2}
              marginTop={{ xs: '4px', md: 2 }}
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
      )}
      {tooltipTitle && <TooltipIcon position="topRight" title={tooltipTitle} />}
    </Container>
  );
};
