import { FC } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import SectionWrapper from '@components/SectionWrapper';
import { FormatNumberWithDecimals } from '@components/Home/FormatNumber';

type Props = {
  amountStaked?: number | null;
  amountLocked?: number | null;
};

const StakeInfo: FC<Props> = ({ amountStaked, amountLocked }) => {
  if (!amountStaked) return null;

  return (
    <SectionWrapper>
      <Box mb={{ xs: 4, md: 8 }}>
        <Typography variant="h5" mb={1.5}>
          Stake Info
        </Typography>
      </Box>
      <Stack gap={4}>
        {amountStaked !== undefined && amountStaked !== null ? (
          <Stack gap={{ xs: 1, md: 0 }} direction={{ sm: 'column', md: 'row' }}>
            <Typography variant="subtitle2" width={300}>
              Tokens Staked
            </Typography>
            <Stack direction="row" whiteSpace="nowrap">
              <Typography variant="body2">
                <FormatNumberWithDecimals value={amountStaked} />
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                component="span"
                ml={0.5}
              >
                HMT
              </Typography>
            </Stack>
          </Stack>
        ) : null}
        {amountLocked !== undefined && amountLocked !== null ? (
          <Stack gap={{ xs: 1, md: 0 }} direction={{ sm: 'column', md: 'row' }}>
            <Typography variant="subtitle2" width={300}>
              Tokens Locked
            </Typography>
            <Stack direction="row" whiteSpace="nowrap">
              <Typography variant="body2">
                <FormatNumberWithDecimals value={amountLocked} />
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                component="span"
                ml={0.5}
              >
                HMT
              </Typography>
            </Stack>
          </Stack>
        ) : null}
      </Stack>
    </SectionWrapper>
  );
};

export default StakeInfo;
