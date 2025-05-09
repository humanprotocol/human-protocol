import { FC } from 'react';

import { Box, Divider, Typography } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useAccount } from 'wagmi';

import { useStakeContext } from '../../contexts/stake';
import CustomTooltip from '../CustomTooltip';
import CardWrapper from '../CardWrapper';
import NetworkStatus from '../NetworkStatus';
import Amount from '../Amount';

const BalanceCard: FC = () => {
  const { tokenBalance } = useStakeContext();
  const { isConnected } = useAccount();

  return (
    <CardWrapper size="lg">
      <Box display="flex" gap={1}>
        <CustomTooltip title="Total balance available in your wallet" arrow>
          <HelpOutlineIcon fontSize="medium" sx={{ color: 'text.secondary' }} />
        </CustomTooltip>
        <Box display="flex" flexDirection="column" alignItems="flex-start">
          <Typography variant="body1" color="text.primary">
            Wallet Balance <strong>HMT</strong>
          </Typography>
          <Amount size="lg" amount={tokenBalance} isConnected={isConnected} />
        </Box>
      </Box>
      <Divider
        component="div"
        sx={{ width: '100%', mt: 2, mb: 3, opacity: 0.4 }}
        color="primary.light"
      />
      <NetworkStatus />
    </CardWrapper>
  );
};

export default BalanceCard;
