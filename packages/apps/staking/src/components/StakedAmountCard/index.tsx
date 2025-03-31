import { FC } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useAccount } from 'wagmi';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

import { colorPalette } from '../../assets/styles/color-palette';
import { useStakeContext } from '../../contexts/stake';
import CustomTooltip from '../CustomTooltip';
import CardWrapper from '../CardWrapper';
import Amount from '../Amount';

type Props = {
  onStakeOpen: () => void;
  onUnstakeOpen: () => void;
};

const StakedAmountCard: FC<Props> = ({ onStakeOpen, onUnstakeOpen }) => {
  const { stakedAmount } = useStakeContext();
  const { isConnected } = useAccount();

  return (
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
              Staked Amount
            </Typography>
            <Amount size="lg" amount={stakedAmount} isConnected={isConnected} />
          </Box>
          <Box display="flex" gap={1} mb={1}>
            <Button size="medium" variant="contained" onClick={onStakeOpen}>
              Stake HMT
            </Button>
            <Button size="medium" variant="outlined" onClick={onUnstakeOpen}>
              Unstake
            </Button>
          </Box>
        </Box>
      </Box>
    </CardWrapper>
  );
};

export default StakedAmountCard;
