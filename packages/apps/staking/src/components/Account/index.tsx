import { FC, useState } from 'react';
import {
  Avatar,
  Button,
  Popover,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useAccount, useDisconnect, useEnsAvatar, useEnsName } from 'wagmi';

import { formatAddress } from '../../utils/string';
import { AvatarIcon, ChevronIcon, PowerIcon } from '../../icons';

const Account: FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const formattedAddress = formatAddress(address);

  const handleClosePopover = () => setAnchorEl(null);

  return (
    <>
      <Button
        aria-describedby="account-popover"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          bgcolor: '#f6f7fe',
          borderRadius: '4px',
          height: isMobile ? '42px' : '100%',
          paddingX: { md: 0.5, lg: 1 },
          fontWeight: 600,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          '& .MuiTouchRipple-root': {
            display: 'none',
          },
        }}
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
        <Typography
          variant="body2"
          color="textPrimary"
          paddingX={1}
          sx={{ fontSize: { md: '12px', lg: '14px' } }}
        >
          {formattedAddress}
        </Typography>
        <ChevronIcon
          sx={{
            transform: anchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease-in-out',
          }}
        />
      </Button>
      <Popover
        id="account-popover"
        open={!!anchorEl}
        onClose={handleClosePopover}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              backgroundColor: '#f6f7fe',
              width: anchorEl?.getBoundingClientRect().width,
              minWidth: 'fit-content',
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              border: 'none',
            },
          },
        }}
      >
        <Button
          onClick={() => disconnect()}
          sx={{
            color: 'sky.main',
            paddingY: 1,
            paddingX: { md: 0.5, lg: 1 },
            width: '100%',
            gap: 1,
            '&:hover': {
              color: 'primary.main',
              backgroundColor: 'unset',
            },
          }}
        >
          <PowerIcon />
          Disconnect wallet
        </Button>
      </Popover>
    </>
  );
};

export default Account;
