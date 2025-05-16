import { FC, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useAccount } from 'wagmi';

import { useStakeContext } from '../../contexts/stake';
import CustomTooltip from '../CustomTooltip';
import CardWrapper from '../CardWrapper';
import Amount from '../Amount';
import WithdrawModal from '../modals/WithdrawModal';

const WithdrawableAmountCard: FC = () => {
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const { withdrawableAmount } = useStakeContext();
  const { isConnected } = useAccount();

  const isWithdrawalDisabled = !isConnected || Number(withdrawableAmount) <= 0;

  const handleWithdrawClick = async () => {
    if (isWithdrawalDisabled) return;
    setWithdrawModalOpen(true);
  };

  return (
    <>
      <CardWrapper size="sm">
        <Box display="flex" gap={1} width="100%">
          <CustomTooltip title="Tokens available for withdrawal" arrow>
            <HelpOutlineIcon
              fontSize="medium"
              sx={{ color: 'text.secondary' }}
            />
          </CustomTooltip>
          <Box display="flex" flexDirection="column" flex={1}>
            <Typography variant="body1" color="text.primary" mb={1}>
              Withdrawable Amount <strong>HMT</strong>
            </Typography>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
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
                Withdraw
              </Button>
            </Box>
          </Box>
        </Box>
      </CardWrapper>
      <WithdrawModal
        open={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
      />
    </>
  );
};

export default WithdrawableAmountCard;
