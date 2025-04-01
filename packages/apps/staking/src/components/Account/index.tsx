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
import { AvatarIcon } from '../../icons';

const Account: FC = () => {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const formattedAddress = formatAddress(address);

  return (
    <>
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        bgcolor="#f6f7fe"
        borderRadius="4px"
        paddingX={1}
        height={isMobile ? '42px' : '100%'}
      >
        {ensAvatar ? (
          <Avatar
            alt="ENS Avatar"
            src={ensAvatar}
            sx={{ width: 24, height: 24 }}
          />
        ) : (
          <AvatarIcon />
        )}
        <Typography variant="body2" color="textPrimary" fontWeight={600}>
          {formattedAddress}
        </Typography>
      </Box>
      <Button
        variant="contained"
        size="medium"
        onClick={() => disconnect()}
        sx={{
          height: isMobile ? '42px' : '100%',
        }}
      >
        Disconnect
      </Button>
    </>
  );
};

export default Account;
