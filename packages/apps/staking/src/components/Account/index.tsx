import { FC } from 'react';
import {
  Avatar,
  Box,
  Button,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useAccount, useDisconnect, useEnsAvatar, useEnsName } from 'wagmi';

import { formatAddress } from '../../utils/string';

const Account: FC = () => {
  const { address, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! });

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.down(1800));

  const formattedAddress = isMediumScreen ? formatAddress(address) : address;

  return (
    <Box
      display="flex"
      flexDirection={isSmallScreen ? 'column' : 'row'}
      alignItems={isSmallScreen ? 'center' : 'center'}
      gap={isSmallScreen ? 1 : 2}
      sx={{ marginLeft: { xs: 0, md: 3 } }}
    >
      <Box
        display="flex"
        justifyContent={isSmallScreen ? 'center' : 'flex-start'}
        width={isSmallScreen ? '100%' : 'auto'}
      >
        {ensAvatar ? (
          <Avatar
            alt="ENS Avatar"
            src={ensAvatar}
            sx={{ width: 40, height: 40 }}
          />
        ) : (
          <Avatar sx={{ width: 40, height: 40 }}>
            {ensName ? ensName[0].toUpperCase() : formattedAddress![0]}
          </Avatar>
        )}
      </Box>

      <Box
        display="flex"
        flexDirection="column"
        alignItems={isSmallScreen ? 'center' : 'flex-start'}
        textAlign={isSmallScreen ? 'center' : 'left'}
      >
        <Typography
          variant="body2"
          fontSize={isSmallScreen ? 14 : 18}
          color="textPrimary"
        >
          {ensName ? `${ensName} (${formattedAddress})` : formattedAddress}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Connected to {connector?.name}
        </Typography>
      </Box>

      <Button
        variant="contained"
        size="medium"
        onClick={() => disconnect()}
        sx={{
          mt: isSmallScreen ? 1 : 0,
          width: isSmallScreen ? '100%' : 'auto',
        }}
      >
        Disconnect
      </Button>
    </Box>
  );
};

export default Account;
