import { FC, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useAccount } from 'wagmi';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

import { colorPalette } from '../../assets/styles/color-palette';
import { useStakeContext } from '../../contexts/stake';
import CustomTooltip from '../CustomTooltip';
import CardWrapper from '../CardWrapper';
import Amount from '../Amount';
import StakeModal from '../modals/StakeModal';
import UnstakeModal from '../modals/UnstakeModal';

const StakedAmountCard: FC = () => {
  const [stakeModalOpen, setStakeModalOpen] = useState(false);
  const [unstakeModalOpen, setUnstakeModalOpen] = useState(false);
  const { stakedAmount } = useStakeContext();
  const { isConnected } = useAccount();

  return (
    <>
      <CardWrapper size="lg">
        <Box display="flex" gap={1} flex={1}>
          <CustomTooltip title="Tokens you have staked" arrow>
            <HelpOutlineIcon
              fontSize="medium"
              sx={{ color: colorPalette.sky.main }}
            />
          </CustomTooltip>
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
          >
            <Box display="flex" flexDirection="column" alignItems="flex-start">
              <Typography variant="body1" color="primary">
                Staked Amount <strong>HMT</strong>
              </Typography>
              <Amount
                size="lg"
                amount={stakedAmount}
                isConnected={isConnected}
              />
            </Box>
            <Box display="flex" gap={1} mb={1}>
              <Button
                size="medium"
                variant="contained"
                disabled={!isConnected}
                onClick={() => isConnected && setStakeModalOpen(true)}
              >
                Stake HMT
              </Button>
              <Button
                size="medium"
                variant="outlined"
                disabled={!isConnected}
                onClick={() => isConnected && setUnstakeModalOpen(true)}
              >
                Unstake
              </Button>
            </Box>
          </Box>
        </Box>
      </CardWrapper>

      <StakeModal
        open={stakeModalOpen}
        onClose={() => setStakeModalOpen(false)}
      />
      <UnstakeModal
        open={unstakeModalOpen}
        onClose={() => setUnstakeModalOpen(false)}
      />
    </>
  );
};

export default StakedAmountCard;
