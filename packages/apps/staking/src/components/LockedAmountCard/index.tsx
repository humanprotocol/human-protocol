import { FC } from 'react';

import { Box, Typography } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useAccount } from 'wagmi';

import { useStakeContext } from '../../contexts/stake';
import CustomTooltip from '../CustomTooltip';
import CardWrapper from '../CardWrapper';
import Amount from '../Amount';

const LockedAmountCard: FC = () => {
  const { lockedAmount } = useStakeContext();
  const { isConnected } = useAccount();

  return (
    <CardWrapper size="sm">
      <Box display="flex" gap={1}>
        <CustomTooltip
          title="Tokens currently locked until a certain block"
          arrow
        >
          <HelpOutlineIcon fontSize="medium" sx={{ color: 'text.secondary' }} />
        </CustomTooltip>
        <Box display="flex" flexDirection="column">
          <Typography variant="body1" color="text.primary" mb={1}>
            Locked Amount <strong>HMT</strong>
          </Typography>
          <Amount size="sm" amount={lockedAmount} isConnected={isConnected} />
        </Box>
      </Box>
    </CardWrapper>
  );
};

export default LockedAmountCard;
