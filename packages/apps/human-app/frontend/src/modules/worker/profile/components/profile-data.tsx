import { type ReactNode } from 'react';
import { Box, Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';

import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { shortenEscrowAddress } from '@/shared/helpers/evm';
import { routerPaths } from '@/router/router-paths';

function Wrapper({
  isCompact,
  isProfilePage,
  children,
}: {
  isCompact: boolean;
  isProfilePage: boolean;
  children: ReactNode;
}) {
  if (isCompact && !isProfilePage) {
    return (
      <Link
        component={RouterLink}
        to={routerPaths.profile}
        sx={{ textDecoration: 'none' }}
      >
        {children}
      </Link>
    );
  }

  return <>{children}</>;
}

export function ProfileData({
  variant = 'compact',
}: {
  variant?: 'compact' | 'expanded';
}) {
  const { user } = useAuthenticatedUser();
  const location = useLocation();

  const isProfilePage = location.pathname === routerPaths.profile;
  const isCompact = variant === 'compact';

  return (
    <Wrapper isCompact={isCompact} isProfilePage={isProfilePage}>
      <Stack
        direction="row"
        sx={{
          gap: { xs: 1, md: 1.5 },
          alignItems: 'center',
          minWidth: 0,
          flex: isCompact ? undefined : '1 1 auto',
        }}
      >
        <Box
          sx={{
            flexShrink: 0,
            textAlign: 'center',
            verticalAlign: 'middle',
            width: { xs: '38px', md: isCompact ? '48px' : '76px' },
            height: { xs: '38px', md: isCompact ? '48px' : '76px' },
            borderRadius: '50%',
            bgcolor: 'common.white',
            border: (theme) => `1px solid ${theme.palette.border.strong}`,
            opacity: 0.8,
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: '14px', md: isCompact ? '24px' : '30px' },
              lineHeight: { xs: '38px', md: isCompact ? '48px' : '76px' },
              color: 'accent.main',
            }}
          >
            {user?.email.charAt(0).toUpperCase()}
          </Typography>
        </Box>
        <Stack
          sx={{
            gap: { xs: 0.5, md: 1 },
            minWidth: 0,
            '&:hover > :first-of-type': {
              textDecoration:
                isCompact && !isProfilePage ? 'underline' : 'none',
            },
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: isCompact ? 14 : 16, md: isCompact ? 16 : 32 },
              fontWeight: { xs: 700, md: 600 },
              color: {
                xs: 'text.primary',
                md: isCompact ? 'text.auxiliary100' : 'text.primary',
              },
              ...(!isCompact && {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }),
            }}
          >
            {user.email}
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: 12, md: isCompact ? 14 : 16 },
              fontWeight: 500,
              color: 'text.auxiliary200',
            }}
          >
            {shortenEscrowAddress(
              user.wallet_address ?? '',
              isCompact ? 9 : 6,
              isCompact ? 8 : 5
            )}
          </Typography>
        </Stack>
      </Stack>
    </Wrapper>
  );
}
