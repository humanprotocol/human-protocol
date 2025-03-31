import { FC, useState } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useAccount } from 'wagmi';

import { colorPalette } from '../../assets/styles/color-palette';
import { useStakeContext } from '../../contexts/stake';
import CustomTooltip from '../CustomTooltip';
import CardWrapper from '../CardWrapper';
import Amount from '../Amount';

const WithdrawableAmountCard: FC = () => {
  const { withdrawableAmount, handleWithdraw } = useStakeContext();
  const { isConnected } = useAccount();
  const [loading, setLoading] = useState(false);

  const isWithdrawalDisabled = loading || Number(withdrawableAmount) <= 0;

  const handleWithdrawClick = async () => {
    if (isWithdrawalDisabled) return;

    setLoading(true);
    try {
      await handleWithdraw();
    } catch (error) {
      console.error('Error during withdrawal:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CardWrapper size="sm">
      <Box display="flex" gap={1} width="100%">
        <CustomTooltip title="Tokens available for withdrawal" arrow>
          <HelpOutlineIcon
            fontSize="medium"
            sx={{ color: colorPalette.sky.main }}
          />
        </CustomTooltip>
        <Box display="flex" flexDirection="column" flex={1}>
          <Typography variant="body1" color="primary" mb={1}>
            Withdrawable Amount
          </Typography>
          <Box display="flex" justifyContent="space-between">
            <Amount
              amount={withdrawableAmount}
              isConnected={isConnected}
              size="sm"
            />
            <Button
              variant="contained"
              onClick={handleWithdrawClick}
              disabled={isWithdrawalDisabled}
            >
              {loading ? <CircularProgress size={24} /> : 'Withdraw'}
            </Button>
          </Box>
        </Box>
      </Box>
    </CardWrapper>
  );
};

export default WithdrawableAmountCard;
