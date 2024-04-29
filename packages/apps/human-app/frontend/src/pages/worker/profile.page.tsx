import {
  Container,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/protected/page-header';
import { CheckmarkIcon, LockerIcon, ProfileIcon } from '@/components/ui/icons';
import { colorPalette } from '@/styles/color-palette';
import { Button } from '@/components/ui/button';
import { useAuthenticatedUser } from '@/auth/use-authenticated-user';
import { useWalletConnect } from '@/hooks/use-wallet-connect';

const mockedData = {
  notificationsConsent: false,
  kycInfoOnChainAdded: false,
};

export function WorkerProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuthenticatedUser();
  const { isConnected: isWalletConnected } = useWalletConnect();

  return (
    <Container maxWidth="xl">
      <PageHeader
        headerIcon={<ProfileIcon />}
        headerText={t('worker.profile.profileHeader')}
      />
      <Paper
        sx={{
          backgroundColor: colorPalette.white,
          height: '100%',
          boxShadow: 'none',
          padding: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <List>
          <ListItemText>
            <Typography
              sx={{
                marginBottom: '10px',
              }}
              variant="subtitle2"
            >
              {t('worker.profile.email')}
            </Typography>
            <Typography color={colorPalette.text.primary} variant="subtitle1">
              {user.email}
            </Typography>
          </ListItemText>
          <ListItemText
            sx={{
              marginTop: '40px',
            }}
          >
            <Typography
              sx={{
                marginBottom: '10px',
              }}
              variant="subtitle2"
            >
              {t('worker.profile.password')}
            </Typography>
            <Button
              color="secondary"
              sx={{
                paddingLeft: 0,
              }}
              variant="text"
            >
              {t('worker.profile.resetPassword')}
            </Button>
          </ListItemText>
          <ListItemText
            sx={{
              marginTop: '20px',
            }}
          >
            <Stack alignItems="center" flexDirection="row">
              <Typography
                color={
                  user.kyc_status !== 'APPROVED'
                    ? colorPalette.text.secondary
                    : colorPalette.text.primary
                }
                sx={{
                  paddingLeft: 0,
                }}
                variant="subtitle2"
              >
                {t('worker.profile.kycCompleted')}
              </Typography>
              <Stack
                sx={{
                  marginLeft: '10px',
                }}
              >
                {user.kyc_status === 'APPROVED' ? (
                  <CheckmarkIcon />
                ) : (
                  <LockerIcon />
                )}
              </Stack>
            </Stack>
          </ListItemText>
          <ListItemText
            sx={{
              marginTop: '20px',
            }}
          >
            <Stack alignItems="center" flexDirection="row">
              <Typography
                color={
                  !isWalletConnected
                    ? colorPalette.text.secondary
                    : colorPalette.text.primary
                }
                sx={{
                  paddingLeft: 0,
                }}
                variant="subtitle2"
              >
                {t('worker.profile.walletConnected')}
              </Typography>
              <Stack
                sx={{
                  marginLeft: '10px',
                }}
              >
                {isWalletConnected ? <CheckmarkIcon /> : <LockerIcon />}
              </Stack>
            </Stack>
          </ListItemText>
          <ListItemText
            sx={{
              marginTop: '20px',
            }}
          >
            <Stack alignItems="center" flexDirection="row">
              <Typography
                color={
                  !mockedData.kycInfoOnChainAdded
                    ? colorPalette.text.secondary
                    : colorPalette.text.primary
                }
                sx={{
                  paddingLeft: 0,
                }}
                variant="subtitle2"
              >
                {t('worker.profile.kycInfoOnChainAdded')}
              </Typography>
              <Stack
                sx={{
                  marginLeft: '10px',
                }}
              >
                {mockedData.kycInfoOnChainAdded ? (
                  <CheckmarkIcon />
                ) : (
                  <LockerIcon />
                )}
              </Stack>
            </Stack>
          </ListItemText>
          <ListItem
            sx={{
              paddingLeft: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              marginTop: '40px',
            }}
          >
            <Typography variant="subtitle2">
              {t('worker.profile.emailNotifications')}
            </Typography>
            <Stack alignItems="center" flexDirection="row">
              <Typography variant="subtitle2">
                {t('worker.profile.notificationsConsent')}
              </Typography>
              <Switch checked={mockedData.notificationsConsent} />
            </Stack>
          </ListItem>
        </List>
      </Paper>
    </Container>
  );
}
